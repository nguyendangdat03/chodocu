// dto/approve-transaction.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveTransactionDto {
  @ApiProperty({
    description: 'Reason for rejection (required for rejections)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
