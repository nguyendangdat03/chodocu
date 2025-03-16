import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateTransactionStatusDto {
  @ApiProperty({
    description: 'Transaction status',
    enum: ['pending'],
    example: 'pending',
  })
  @IsEnum(['pending'], {
    message: 'Status must be "pending"',
  })
  status: 'pending';
}
