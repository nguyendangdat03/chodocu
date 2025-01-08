import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Tên người dùng', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Số điện thoại', example: '+84123456789' })
  phoneNumber: string;

  @ApiProperty({ description: 'Email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'password123' })
  password: string;
}
