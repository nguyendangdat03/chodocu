import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'User full name',
  })
  @IsNotEmpty({ message: 'Tên không được để trống.' })
  @IsString({ message: 'Tên phải là chuỗi ký tự.' })
  name: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Vietnamese phone number (10 digits starting with 0)',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống.' })
  @Matches(/^0\d{9}$/, {
    message:
      'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ.',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;

  @ApiProperty({
    example: 'Pass123',
    description:
      'Password (at least 7 characters including letters and numbers)',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(7, { message: 'Mật khẩu phải có ít nhất 7 ký tự.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và số.',
  })
  password: string;
}
