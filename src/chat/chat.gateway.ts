import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  private userSocketMap = new Map<number, string[]>(); // Maps userId to socketIds

  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from userSocketMap when disconnected
    for (const [userId, socketIds] of this.userSocketMap.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSocketMap.delete(userId);
        } else {
          this.userSocketMap.set(userId, socketIds);
        }
        break;
      }
    }
  }

  // Client join vào room theo user ID
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ): WsResponse<any> {
    try {
      if (!data.userId) {
        throw new Error('userId is required');
      }

      const room = `user_${data.userId}`;
      client.join(room);
      this.logger.log(`User ${data.userId} joined room ${room}`);

      // Store socket id for this user
      const socketIds = this.userSocketMap.get(data.userId) || [];
      if (!socketIds.includes(client.id)) {
        socketIds.push(client.id);
        this.userSocketMap.set(data.userId, socketIds);
      }

      return { event: 'joined', data: { room, socketId: client.id } };
    } catch (error) {
      this.logger.error(`Error in handleJoin: ${error.message}`, error.stack);
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): Promise<WsResponse<any>> {
    try {
      // More robust data handling
      let conversationId: number;
      let userId: number | undefined;

      if (typeof data === 'object') {
        // Handle case where data is an object with conversationId
        if (data.conversationId !== undefined) {
          conversationId = Number(data.conversationId);
          if (data.userId !== undefined) {
            userId = Number(data.userId);
          }
        }
        // Handle case where data might directly be the conversation ID as first element
        else if (data[0] !== undefined) {
          conversationId = Number(data[0]);
        } else {
          throw new Error('conversationId is required');
        }
      }
      // Handle case where data might directly be the conversation ID
      else if (typeof data === 'number' || !isNaN(Number(data))) {
        conversationId = Number(data);
      } else {
        throw new Error('conversationId is required and must be a number');
      }

      if (!conversationId || isNaN(conversationId)) {
        throw new Error('Valid conversationId is required');
      }

      const room = `conversation_${conversationId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined conversation room ${room}`);

      // If userId is provided, store this association for later use
      if (userId) {
        client.data = client.data || {};
        client.data.userId = userId;

        // Store socket id for this user if not already tracked
        const socketIds = this.userSocketMap.get(userId) || [];
        if (!socketIds.includes(client.id)) {
          socketIds.push(client.id);
          this.userSocketMap.set(userId, socketIds);
        }

        // Check if the conversation exists and the user has access
        try {
          const conversationList =
            await this.chatService.getConversations(userId);
          const conversation = conversationList.find(
            (conv) => conv.id === conversationId,
          );

          if (!conversation) {
            this.logger.warn(
              `User ${userId} joined conversation ${conversationId} but it wasn't found in their conversations`,
            );
          } else {
            // Inform the client about successful join with conversation data
            return {
              event: 'conversation_joined',
              data: {
                room,
                conversation,
                success: true,
              },
            };
          }
        } catch (error) {
          this.logger.error(
            `Error verifying conversation access: ${error.message}`,
            error.stack,
          );
          // Continue despite error - we'll just provide basic join confirmation
        }
      }

      return { event: 'conversation_joined', data: { room, success: true } };
    } catch (error) {
      this.logger.error(
        `Error in handleJoinConversation: ${error.message}`,
        error.stack,
      );
      return { event: 'error', data: error.message };
    }
  }

  // Client gửi tin nhắn typing
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId?: number },
  ): Promise<WsResponse<any>> {
    try {
      if (!data.conversationId) {
        throw new Error('conversationId is required');
      }

      const room = `conversation_${data.conversationId}`;

      // Emit to all clients in the conversation room except the sender
      client.to(room).emit('user_typing', {
        conversationId: data.conversationId,
        userId: data.userId,
      });

      return { event: 'typing_sent', data: { success: true } };
    } catch (error) {
      this.logger.error(`Error in handleTyping: ${error.message}`, error.stack);
      return { event: 'error', data: error.message };
    }
  }

  // Client tạo cuộc trò chuyện mới
  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { userId: number; createConversationDto: CreateConversationDto },
  ): Promise<WsResponse<any>> {
    try {
      if (!data.userId || !data.createConversationDto) {
        throw new Error('userId and createConversationDto are required');
      }

      const conversation = await this.chatService.createConversation(
        data.userId,
        data.createConversationDto,
      );

      // Join sender to the new conversation room
      const room = `conversation_${conversation.id}`;
      client.join(room);

      // Thông báo cho người nhận về cuộc trò chuyện mới
      conversation.participants.forEach((participant) => {
        if (participant.id !== data.userId) {
          this.server
            .to(`user_${participant.id}`)
            .emit('newConversation', conversation);
        }
      });

      return { event: 'conversationCreated', data: conversation };
    } catch (error) {
      this.logger.error(
        `Error in handleCreateConversation: ${error.message}`,
        error.stack,
      );
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; sendMessageDto: SendMessageDto },
  ): Promise<WsResponse<any>> {
    try {
      if (!data.userId || !data.sendMessageDto) {
        throw new Error('userId and sendMessageDto are required');
      }

      const message = await this.chatService.sendMessage(
        data.userId,
        data.sendMessageDto,
      );

      const conversationId = data.sendMessageDto.conversationId;
      const conversationRoom = `conversation_${conversationId}`;

      // Broadcast to the conversation room
      this.server.to(conversationRoom).emit('newMessage', {
        message,
        conversationId,
      });

      // Get the conversation
      try {
        const conversationObj = await this.chatService.getConversations(
          data.userId,
        );
        const currentConversation = conversationObj.find(
          (conv) => conv.id === conversationId,
        );

        // Check if currentConversation exists and has participants
        if (currentConversation && currentConversation.participants) {
          // Also send to each participant's user room (for clients that haven't joined the conversation room)
          currentConversation.participants.forEach((participant) => {
            this.server.to(`user_${participant.id}`).emit('newMessage', {
              message,
              conversationId,
            });
          });
        } else {
          this.logger.warn(
            `Conversation ${conversationId} not found or has no participants`,
          );
        }
      } catch (convError) {
        // If there's an error getting the conversation, log it but don't fail the message sending
        this.logger.error(
          `Error retrieving conversation: ${convError.message}`,
          convError.stack,
        );
      }

      return { event: 'messageSent', data: message };
    } catch (error) {
      this.logger.error(
        `Error in handleSendMessage: ${error.message}`,
        error.stack,
      );
      return { event: 'error', data: error.message };
    }
  }

  // Helper method to extract userId from socket
  private getUserIdFromSocket(client: Socket): number | null {
    // Check if user ID is stored in handshake data
    if (client.handshake.query && client.handshake.query.userId) {
      return Number(client.handshake.query.userId);
    }

    // Check if user ID is stored in socket data
    if (client.data && client.data.userId) {
      return Number(client.data.userId);
    }

    // Try to find userId from the rooms this socket has joined
    const rooms = Array.from(client.rooms || []);
    for (const room of rooms) {
      if (room.startsWith('user_')) {
        const userId = Number(room.replace('user_', ''));
        if (!isNaN(userId)) {
          return userId;
        }
      }
    }

    // Check if we can find the user ID from our userSocketMap
    for (const [userId, socketIds] of this.userSocketMap.entries()) {
      if (socketIds.includes(client.id)) {
        return userId;
      }
    }

    return null;
  }
}
