import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Đăng ký tài khoản mới
  @Post('register')
  async register(
    @Body('name') name: string,
    @Body('phoneNumber') phoneNumber: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(name, phoneNumber, email, password);
  }

  // Đăng nhập
  @Post('login')
  @HttpCode(200) // Đặt mã phản hồi HTTP thành 200
  async login(
    @Body('phoneNumber') phoneNumber: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.login(phoneNumber, password, res);
    return res.send(result);
  }

  // Đăng xuất
  @Post('logout')
  @HttpCode(200) // Đặt mã phản hồi HTTP thành 200
  async logout(@Res() res: Response) {
    this.authService.logout(res);
    return res.send({ message: 'Logout successful' });
  }
}
