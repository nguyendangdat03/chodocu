import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID của người nhận tin nhắn' })
  @IsNumber()
  receiverId: number;
}
