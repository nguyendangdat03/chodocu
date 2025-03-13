import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Đăng ký tài khoản mới
  async register(
    name: string,
    phoneNumber: string,
    email: string,
    password: string,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { phone_number: phoneNumber },
    });
    if (existingUser) {
      throw new BadRequestException('Phone number already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      phone_number: phoneNumber,
      email,
      password: hashedPassword,
      role: 'user', // Gán mặc định là user
      status: 'active', // Gán mặc định là pending
    });
    return this.userRepository.save(user);
  }

  // Đăng nhập
  async login(phoneNumber: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({
      where: { phone_number: phoneNumber },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Chỉ cho phép tài khoản active đăng nhập
    if (user.status !== 'active') {
      if (user.status === 'inactive') {
        throw new BadRequestException('Your account has been deactivated.');
      } else if (user.status === 'pending') {
        throw new BadRequestException('Your account is pending approval.');
      } else {
        throw new BadRequestException('Your account is not active.');
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials.');
    }

    // Thiết lập cookie role và user_id
    res.cookie('role', user.role, { httpOnly: true, secure: false }); // Secure chỉ bật trong HTTPS
    res.cookie('user_id', user.id, { httpOnly: true, secure: false });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  // Đăng xuất
  logout(res: Response) {
    // Xóa cookie role và user_id
    res.clearCookie('role', { httpOnly: true });
    res.clearCookie('user_id', { httpOnly: true });
  }

  // Lấy thông tin người dùng
  async getUserInfo(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      name: user.name,
      phone_number: user.phone_number,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // Lấy tổng số lượng người dùng
  async getUserCount() {
    const count = await this.userRepository.count();
    return { count };
  }

  // Lấy tất cả người dùng (chỉ admin có quyền)
  async getAllUsers() {
    const users = await this.userRepository.find({
      select: [
        'id',
        'name',
        'phone_number',
        'email',
        'role',
        'status',
        'created_at',
        'updated_at',
      ],
      order: {
        created_at: 'DESC',
      },
    });

    return { users };
  }

  // Lấy người dùng có phân trang
  async getPaginatedUsers(page: number = 1, limit: number = 20) {
    // Ensure positive values
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 20;

    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'name',
        'phone_number',
        'email',
        'role',
        'status',
        'created_at',
        'updated_at',
      ],
      order: {
        created_at: 'DESC',
      },
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Cập nhật trạng thái tài khoản
  async updateAccountStatus(
    userId: number,
    newStatus: 'active' | 'inactive' | 'pending',
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.status = newStatus;
    await this.userRepository.save(user);

    return {
      message: `Account status updated to ${newStatus}`,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }
}
