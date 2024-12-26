import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { role, user_id } = req.cookies;

    // Log cookie để kiểm tra
    console.log('Cookies received:', req.cookies);

    if (!role || !user_id) {
      throw new UnauthorizedException('Unauthorized: Missing role or user_id in cookies');
    }

    // Phân quyền dựa trên role và endpoint
    if (this.isAdminRoute(req.path) && role !== 'admin') {
      throw new ForbiddenException('Forbidden: Admin access required');
    }

    if (this.isUserRoute(req.path) && role !== 'user') {
      throw new ForbiddenException('Forbidden: User access required');
    }

    // Lưu thông tin vào request object
    req['user'] = { role, user_id };
    next();
  }

  // Kiểm tra route cần quyền admin
  private isAdminRoute(path: string): boolean {
    const adminRoutes = ['/categories', '/brands'];
    return adminRoutes.some((route) => path.startsWith(route));
  }

  // Kiểm tra route cần quyền user
  private isUserRoute(path: string): boolean {
    const userRoutes = ['/products'];
    return userRoutes.some((route) => path.startsWith(route));
  }
}
