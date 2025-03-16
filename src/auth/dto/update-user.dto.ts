import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Current password (required when changing password)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ required: false, description: 'New password' })
  @IsOptional()
  @IsString()
  @MinLength(7, { message: 'Mật khẩu phải có ít nhất 7 ký tự.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và số.',
  })
  password?: string;
}
