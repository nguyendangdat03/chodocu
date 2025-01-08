import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.name,
      registerDto.phoneNumber,
      registerDto.email,
      registerDto.password,
    );
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res() res) {
    const result = await this.authService.login(
      loginDto.phoneNumber,
      loginDto.password,
      res,
    );
    return res.send(result);
  }

  @Get('user/:id')
  async getUserInfo(@Param('id') userId: number) {
    return this.authService.getUserInfo(userId);
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }
    return this.authService.getUserInfo(parseInt(userId));
  }
}
