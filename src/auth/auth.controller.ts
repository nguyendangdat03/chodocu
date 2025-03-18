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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusRoleDto } from './dto/update-status-role.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
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
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto, @Res() res) {
    const result = await this.authService.login(
      loginDto.phoneNumber,
      loginDto.password,
      res,
    );
    return res.send(result);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user information by ID' })
  async getUserInfo(@Param('id') userId: number) {
    return this.authService.getUserInfo(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user information' })
  async getCurrentUser(@Req() req: Request) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }
    return this.authService.getUserInfo(parseInt(userId));
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile (name, email, password)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    return this.authService.updateUserProfile(parseInt(userId), updateUserDto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'User logout' })
  async logout(@Res() res: Response) {
    this.authService.logout(res);
    return res.send({ message: 'Logout successful' });
  }

  // Cập nhật API hiện có để chỉ cho admin quyền truy cập
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  async updateUserStatus(
    @Param('id') userId: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.updateAccountStatus(userId, updateStatusDto.status);
  }

  @Get('users/count')
  @ApiOperation({ summary: 'Get total user count' })
  async getUserCount(@Req() req: Request) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.authService.getUserCount();
  }

  @Get('users/all')
  @ApiOperation({ summary: 'Get all users (non-paginated)' })
  async getAllUsers(@Req() req: Request) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.authService.getAllUsers();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated users (default: 20 per page)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
  })
  async getPaginatedUsers(
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }

    const { page = 1, limit = 20 } = paginationDto;
    return this.authService.getPaginatedUsers(page, limit);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user status and role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUserStatusRole(
    @Param('id') userId: number,
    @Body() updateUserStatusRoleDto: UpdateUserStatusRoleDto,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    // Kiểm tra nếu cả hai trường đều không được cung cấp
    if (!updateUserStatusRoleDto.status && !updateUserStatusRoleDto.role) {
      throw new BadRequestException(
        'At least one field (status or role) is required',
      );
    }

    return this.authService.updateUserStatusRole(
      userId,
      updateUserStatusRoleDto,
    );
  }
}
