import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Tạo cuộc trò chuyện mới' })
  @ApiResponse({
    status: 201,
    description: 'Cuộc trò chuyện đã được tạo thành công',
  })
  createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const { user_id } = req.user;
    return this.chatService.createConversation(user_id, createConversationDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện của người dùng' })
  getConversations(@Request() req) {
    const { user_id } = req.user;
    return this.chatService.getConversations(user_id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lấy tin nhắn của cuộc trò chuyện' })
  getConversationMessages(@Request() req, @Param('id') conversationId: number) {
    const { user_id } = req.user;
    return this.chatService.getConversationMessages(user_id, conversationId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Gửi tin nhắn mới' })
  sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const { user_id } = req.user;
    return this.chatService.sendMessage(user_id, sendMessageDto);
  }
}
