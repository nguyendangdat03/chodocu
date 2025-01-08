import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Số điện thoại', example: '+84123456789' })
  phoneNumber: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'password123' })
  password: string;
}
