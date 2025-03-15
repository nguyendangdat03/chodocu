import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    description: 'User name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description:
      'User password (min 7 characters, must contain letters and numbers)',
  })
  @IsString()
  @IsOptional()
  @MinLength(7, { message: 'Mật khẩu phải có ít nhất 7 ký tự.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và số.',
  })
  password?: string;
}
