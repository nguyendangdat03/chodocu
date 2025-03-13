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
      // Lấy thêm thông tin chi tiết của người dùng
      // .leftJoinAndSelect(
      //   'participant.avatar',
      //   'avatar',
      //   'avatar.user_id = participant.id',
      // )
      // .leftJoinAndSelect(
      //   'participant.profile',
      //   'profile',
      //   'profile.user_id = participant.id',
      // )
      // Lọc các cuộc trò chuyện mà người dùng hiện tại tham gia
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
      const receivers = conversation.participants.filter(
        (participant) => participant.id !== userId,
      );

      // Lọc ra người dùng hiện tại
      const currentUser = conversation.participants.find(
        (participant) => participant.id === userId,
      );

      // Lấy tin nhắn mới nhất
      let lastMessage = null;
      if (conversation.messages && conversation.messages.length > 0) {
        // Sắp xếp tin nhắn theo thời gian giảm dần và lấy tin nhắn đầu tiên
        conversation.messages.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        lastMessage = conversation.messages[0];
      }

      // Đếm số tin nhắn chưa đọc
      const unreadCount = conversation.messages
        ? conversation.messages.filter(
            (msg) => !msg.is_read && msg.sender_id !== userId,
          ).length
        : 0;

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
        unreadCount: unreadCount,
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

    return this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  async markMessagesAsRead(
    userId: number,
    conversationId: number,
  ): Promise<void> {
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

    // Đánh dấu tất cả tin nhắn là đã đọc (trừ tin nhắn của người dùng hiện tại)
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  }
}
