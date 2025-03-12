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
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

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

  @Post('logout')
  @HttpCode(200)
  async logout(@Res() res: Response) {
    this.authService.logout(res);
    return res.send({ message: 'Logout successful' });
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.authService.updateAccountStatus(userId, updateStatusDto.status);
  }

  @Get('users/count')
  async getUserCount(@Req() req: Request) {
    // The middleware should have already attached the user info to req['user']
    // But we can double-check here
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.authService.getUserCount();
  }

  @Get('users/all')
  async getAllUsers(@Req() req: Request) {
    // The middleware should have already attached the user info to req['user']
    // But we can double-check here
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.authService.getAllUsers();
  }
}
