import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveProductDto {
  @ApiProperty({
    required: false,
    description: 'Rejection reason (required if rejecting)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
