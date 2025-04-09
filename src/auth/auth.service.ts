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
    // Validate phone number format (Vietnamese: 10 digits starting with 0)
    if (!phoneNumber.match(/^0\d{9}$/)) {
      throw new BadRequestException(
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ.',
      );
    }

    // Validate password length and content
    if (password.length < 7) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 7 ký tự.');
    }

    // Validate password contains both letters and numbers
    if (!password.match(/^(?=.*[A-Za-z])(?=.*\d).+$/)) {
      throw new BadRequestException('Mật khẩu phải bao gồm cả chữ cái và số.');
    }

    // Check if phone number already exists
    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone_number: phoneNumber },
    });

    if (existingUserByPhone) {
      throw new BadRequestException('Số điện thoại đã được đăng ký.');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: email },
    });

    if (existingUserByEmail) {
      throw new BadRequestException('Email đã được đăng ký.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      phone_number: phoneNumber,
      email,
      password: hashedPassword,
      role: 'user', // Gán mặc định là user
      status: 'active', // Gán mặc định là active
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
        avatar_url: user.avatar_url,
        balance: user.balance,
        subscription_type: user.subscription_type, // Add this field
        subscription_expiry: user.subscription_expiry, // Add this field
      },
    };
  }

  // Đăng xuất
  logout(res: Response) {
    // Xóa cookie role và user_id
    res.clearCookie('role', { httpOnly: true });
    res.clearCookie('user_id', { httpOnly: true });
  }

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
      avatar_url: user.avatar_url,
      balance: user.balance,
      subscription_type: user.subscription_type, // Add this field
      subscription_expiry: user.subscription_expiry, // Add this field
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
  // Updated getAllUsers method
  async getAllUsers() {
    const users = await this.userRepository.find({
      select: [
        'id',
        'name',
        'phone_number',
        'email',
        'role',
        'status',
        'avatar_url',
        'balance',
        'subscription_type', // Add this field
        'subscription_expiry', // Add this field
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
  // Updated getPaginatedUsers method
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
        'avatar_url',
        'balance',
        'subscription_type', // Add this field
        'subscription_expiry', // Add this field
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
        avatar_url: user.avatar_url,
        balance: user.balance,
        subscription_type: user.subscription_type, // Add this field
        subscription_expiry: user.subscription_expiry, // Add this field
      },
    };
  }

  // Thêm phương thức mới vào AuthService

  // Cập nhật trạng thái và quyền tài khoản
  async updateUserStatusRole(
    userId: number,
    updateData: {
      status?: 'active' | 'inactive' | 'pending';
      role?: 'user' | 'moderator' | 'admin';
    },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Cập nhật trạng thái nếu được cung cấp
    if (updateData.status) {
      user.status = updateData.status;
    }

    // Cập nhật quyền nếu được cung cấp
    if (updateData.role) {
      user.role = updateData.role;
    }

    await this.userRepository.save(user);
    return {
      message: `User information updated successfully`,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        balance: user.balance,
        subscription_type: user.subscription_type, // Add this field
        subscription_expiry: user.subscription_expiry, // Add this field
      },
    };
  }

  // Cập nhật avatar cho người dùng
  async updateUserAvatar(userId: number, avatarUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Extract object name from old avatar URL if it exists
    let oldAvatarObjectName = null;
    if (user.avatar_url) {
      try {
        const url = new URL(user.avatar_url);
        const pathParts = url.pathname.split('/');
        if (pathParts.length > 2) {
          // The object name should be the last part of the path
          oldAvatarObjectName = pathParts[pathParts.length - 1];
        }
      } catch (error) {
        // If URL parsing fails, just ignore it
        console.warn(`Failed to parse old avatar URL: ${user.avatar_url}`);
      }
    }

    // Set the new avatar URL
    user.avatar_url = avatarUrl;
    await this.userRepository.save(user);

    return {
      message: 'Avatar updated successfully',
      user: {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        subscription_type: user.subscription_type, // Add this field
        subscription_expiry: user.subscription_expiry, // Add this field
      },
      oldAvatarObjectName,
    };
  }
  async updateUserProfile(userId: number, updateData: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Update name if provided
    if (updateData.name) {
      user.name = updateData.name;
    }

    // Update email if provided
    if (updateData.email && updateData.email !== user.email) {
      // Check if email already exists for another user
      const existingUserWithEmail = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new BadRequestException(
          'Email đã được đăng ký bởi người dùng khác.',
        );
      }

      user.email = updateData.email;
    }

    // Update password if provided
    if (updateData.password) {
      // Check if currentPassword is provided
      if (!updateData.currentPassword) {
        throw new BadRequestException(
          'Vui lòng cung cấp mật khẩu hiện tại để thay đổi mật khẩu.',
        );
      }

      // Verify if the current password is correct
      const isCurrentPasswordValid = await bcrypt.compare(
        updateData.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
      }

      // Validate password length and content
      if (updateData.password.length < 7) {
        throw new BadRequestException('Mật khẩu phải có ít nhất 7 ký tự.');
      }

      // Validate password contains both letters and numbers
      if (!updateData.password.match(/^(?=.*[A-Za-z])(?=.*\d).+$/)) {
        throw new BadRequestException(
          'Mật khẩu phải bao gồm cả chữ cái và số.',
        );
      }

      user.password = await bcrypt.hash(updateData.password, 10);
    }

    // Save the updated user
    await this.userRepository.save(user);

    return {
      message: 'Thông tin tài khoản đã được cập nhật thành công',
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        subscription_type: user.subscription_type, // Add this field
        subscription_expiry: user.subscription_expiry, // Add this field
        updated_at: user.updated_at,
      },
    };
  }
}
