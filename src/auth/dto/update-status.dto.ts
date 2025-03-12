import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'User account status',
    enum: ['active', 'inactive', 'pending'],
    example: 'active',
  })
  @IsNotEmpty()
  @IsEnum(['active', 'inactive', 'pending'], {
    message: 'Status must be one of: active, inactive, pending',
  })
  status: 'active' | 'inactive' | 'pending';
}
