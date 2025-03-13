import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Xử lý khi client kết nối
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Xử lý khi client ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client join vào room theo user ID
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const room = `user_${data.userId}`;
    client.join(room);
    console.log(`User ${data.userId} joined room ${room}`);
    return { event: 'joined', data: { room } };
  }

  // Client tạo cuộc trò chuyện mới
  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { userId: number; createConversationDto: CreateConversationDto },
  ) {
    try {
      const conversation = await this.chatService.createConversation(
        data.userId,
        data.createConversationDto,
      );

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
      return { event: 'error', data: error.message };
    }
  }

  // Client gửi tin nhắn
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; sendMessageDto: SendMessageDto },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.userId,
        data.sendMessageDto,
      );

      const conversation = await this.chatService.getConversationMessages(
        data.userId,
        data.sendMessageDto.conversationId,
      );

      if (conversation && conversation.length > 0) {
        // Lấy cuộc trò chuyện
        const conversationObj = await this.chatService.getConversations(
          data.userId,
        );
        const currentConversation = conversationObj.find(
          (conv) => conv.id === data.sendMessageDto.conversationId,
        );

        // Gửi tin nhắn mới đến tất cả người tham gia
        if (currentConversation) {
          currentConversation.participants.forEach((participant) => {
            this.server.to(`user_${participant.id}`).emit('newMessage', {
              message,
              conversationId: data.sendMessageDto.conversationId,
            });
          });
        }
      }

      return { event: 'messageSent', data: message };
    } catch (error) {
      return { event: 'error', data: error.message };
    }
  }

  // Client đánh dấu tin nhắn đã đọc
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; conversationId: number },
  ) {
    try {
      await this.chatService.markMessagesAsRead(
        data.userId,
        data.conversationId,
      );

      // Lấy cuộc trò chuyện
      const conversationObj = await this.chatService.getConversations(
        data.userId,
      );
      const currentConversation = conversationObj.find(
        (conv) => conv.id === data.conversationId,
      );

      // Thông báo cho tất cả người tham gia về việc tin nhắn đã được đọc
      if (currentConversation) {
        currentConversation.participants.forEach((participant) => {
          this.server.to(`user_${participant.id}`).emit('messagesRead', {
            conversationId: data.conversationId,
            userId: data.userId,
          });
        });
      }

      return {
        event: 'markedAsRead',
        data: { conversationId: data.conversationId },
      };
    } catch (error) {
      return { event: 'error', data: error.message };
    }
  }
}
