import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserStatusRoleDto {
  @ApiProperty({
    enum: ['active', 'inactive', 'pending'],
    description: 'User account status',
    required: false,
  })
  @IsEnum(['active', 'inactive', 'pending'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'pending';

  @ApiProperty({
    enum: ['user', 'moderator', 'admin'],
    description: 'User role',
    required: false,
  })
  @IsEnum(['user', 'moderator', 'admin'])
  @IsOptional()
  role?: 'user' | 'moderator' | 'admin';
}
