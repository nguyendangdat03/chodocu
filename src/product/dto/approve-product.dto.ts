import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveProductDto {
  @ApiProperty({
    enum: ['approved', 'rejected'],
    description: 'Product status to update',
  })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiProperty({
    required: false,
    description: 'Rejection reason (required if rejecting)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
