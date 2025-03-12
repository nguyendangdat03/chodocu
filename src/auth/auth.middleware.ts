import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { role, user_id } = req.cookies;

    // Log cookie và endpoint
    console.log('Cookies received:', req.cookies);
    console.log('Request Path:', req.path);
    console.log('Request Method:', req.method);
    console.log('Request Base URL:', req.baseUrl);
    console.log('Full URL:', req.originalUrl);

    if (!role || !user_id) {
      console.error('Missing role or user_id in cookies');
      throw new UnauthorizedException(
        'Unauthorized: Missing role or user_id in cookies',
      );
    }

    // Phân quyền dựa trên role và endpoint
    const fullPath = req.baseUrl + req.path;
    console.log('Checking access for full path:', fullPath);

    if (
      this.isAdminRoute(fullPath) &&
      role !== 'admin' &&
      role !== 'moderator'
    ) {
      console.error(
        `Access denied for role: ${role} on admin route: ${fullPath}`,
      );
      throw new ForbiddenException(
        'Forbidden: Admin or Moderator access required',
      );
    }

    if (
      this.isUserOrAdminRoute(fullPath) &&
      !['user', 'admin', 'moderator'].includes(role)
    ) {
      console.error(
        `Access denied for role: ${role} on user/admin route: ${fullPath}`,
      );
      throw new ForbiddenException(
        'Forbidden: User, Moderator or Admin access required',
      );
    }

    // Lưu thông tin vào request object - nhất quán với cách sử dụng
    req['user'] = {
      role,
      user_id: parseInt(user_id, 10), // Đảm bảo là số
      id: parseInt(user_id, 10), // Thêm id để tương thích với cả hai cách
    };

    console.log('User object added to request:', req['user']);
    next();
  }

  // Kiểm tra route cần quyền admin
  private isAdminRoute(path: string): boolean {
    // Thêm các route patterns cụ thể hơn
    return (
      path.includes('/admin/') ||
      path.includes('/categories') ||
      path.includes('/brands') ||
      path.includes('/auth/users/count') ||
      path.includes('/auth/users/all')
    );
  }

  // Kiểm tra route cần quyền user hoặc admin
  private isUserOrAdminRoute(path: string): boolean {
    return path.includes('/products');
  }
}
