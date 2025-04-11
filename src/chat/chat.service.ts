import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../auth/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createConversation(
    userId: number,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const { receiverId } = createConversationDto;

    if (userId === receiverId) {
      throw new BadRequestException(
        'Không thể tạo cuộc trò chuyện với chính mình',
      );
    }

    // Kiểm tra xem user có tồn tại không
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
    });

    if (!currentUser || !receiver) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Kiểm tra xem cuộc trò chuyện giữa 2 người đã tồn tại chưa
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant1')
      .innerJoin('conversation.participants', 'participant2')
      .where('participant1.id = :userId', { userId })
      .andWhere('participant2.id = :receiverId', { receiverId })
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    // Tạo cuộc trò chuyện mới
    const newConversation = this.conversationRepository.create({
      participants: [currentUser, receiver],
    });

    return this.conversationRepository.save(newConversation);
  }

  async sendMessage(
    userId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const { conversationId, content } = sendMessageDto;

    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra xem người gửi có trong cuộc trò chuyện không
    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );
    if (!isParticipant) {
      throw new BadRequestException(
        'Bạn không phải là thành viên của cuộc trò chuyện này',
      );
    }

    // Tạo tin nhắn mới
    const newMessage = this.messageRepository.create({
      content,
      sender_id: userId,
      conversation_id: conversationId,
    });

    return this.messageRepository.save(newMessage);
  }

  async getConversations(userId: number): Promise<any[]> {
    // Lấy tất cả cuộc trò chuyện mà người dùng hiện tại tham gia
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect(
        'conversation.messages',
        'message',
        'message.conversation_id = conversation.id',
      )
      .leftJoinAndSelect('message.sender', 'messageSender')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('cp.conversation_id')
          .from('conversation_participants', 'cp')
          .where('cp.user_id = :userId')
          .getQuery();
        return 'conversation.id IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .orderBy('message.created_at', 'DESC')
      .getMany();

    // Xử lý và định dạng lại kết quả để dễ sử dụng hơn
    return conversations.map((conversation) => {
      // Lọc ra người nhận (người không phải là người dùng hiện tại)
      const receivers = conversation.participants
        .filter((participant) => participant.id !== userId)
        .map((participant) => {
          // Sanitize user data by removing sensitive fields
          const {
            password,
            role,
            status,
            subscription_type,
            subscription_expiry,
            ...sanitizedUser
          } = participant;
          return sanitizedUser;
        });

      // Lọc ra người dùng hiện tại
      const currentUserFull = conversation.participants.find(
        (participant) => participant.id === userId,
      );

      // Sanitize current user data
      let currentUser = null;
      if (currentUserFull) {
        const {
          password,
          role,
          status,
          subscription_type,
          subscription_expiry,
          ...sanitizedUser
        } = currentUserFull;
        currentUser = sanitizedUser;
      }

      // Lấy tin nhắn mới nhất
      let lastMessage = null;
      if (conversation.messages && conversation.messages.length > 0) {
        // Sắp xếp tin nhắn theo thời gian giảm dần và lấy tin nhắn đầu tiên
        conversation.messages.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        lastMessage = { ...conversation.messages[0] };

        // Sanitize sender data in last message if it exists
        if (lastMessage.sender) {
          const {
            password,
            role,
            status,
            subscription_type,
            subscription_expiry,
            ...sanitizedSender
          } = lastMessage.sender;
          lastMessage.sender = sanitizedSender;
        }
      }

      // Trả về định dạng phù hợp
      return {
        id: conversation.id,
        title: conversation.title,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        currentUser: currentUser,
        receivers: receivers, // Thông tin người nhận/người còn lại trong cuộc trò chuyện
        lastMessage: lastMessage,
      };
    });
  }

  async getConversationMessages(
    userId: number,
    conversationId: number,
  ): Promise<Message[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra xem người dùng có trong cuộc trò chuyện không
    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );
    if (!isParticipant) {
      throw new BadRequestException(
        'Bạn không phải là thành viên của cuộc trò chuyện này',
      );
    }

    const messages = await this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });

    // Sanitize sender data in each message
    return messages.map((message) => {
      // Create a new object to avoid modifying the original
      const sanitizedMessage = { ...message };

      if (sanitizedMessage.sender) {
        const {
          password,
          role,
          status,
          subscription_type,
          subscription_expiry,
          ...sanitizedSender
        } = sanitizedMessage.sender;
        sanitizedMessage.sender = sanitizedSender as User; // Add type assertion here
      }

      return sanitizedMessage;
    });
  }
}
