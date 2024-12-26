import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { role, user_id } = req.cookies;

    // Log cookie và endpoint
    console.log('Cookies received:', req.cookies);
    console.log('Request Path:', req.path);

    if (!role || !user_id) {
      console.error('Missing role or user_id in cookies');
      throw new UnauthorizedException('Unauthorized: Missing role or user_id in cookies');
    }

    // Phân quyền dựa trên role và endpoint
    if (this.isAdminRoute(req.path) && role !== 'admin') {
      console.error(`Access denied for role: ${role} on admin route: ${req.path}`);
      throw new ForbiddenException('Forbidden: Admin access required');
    }

    if (this.isUserOrAdminRoute(req.path) && !['user', 'admin'].includes(role)) {
      console.error(`Access denied for role: ${role} on user/admin route: ${req.path}`);
      throw new ForbiddenException('Forbidden: User or Admin access required');
    }

    // Lưu thông tin vào request object
    req['user'] = { role, user_id };

    if (role === 'admin') {
      req['admin'] = { role, isAdmin: true };
    }

    console.log('User object added to request:', req['user']);
    next();
  }

  // Kiểm tra route cần quyền admin
  private isAdminRoute(path: string): boolean {
    const adminRoutes = ['/categories', '/brands', '/admin/products'];
    return adminRoutes.some((route) => path.startsWith(route));
  }

  // Kiểm tra route cần quyền user hoặc admin
  private isUserOrAdminRoute(path: string): boolean {
    const userOrAdminRoutes = ['/products'];
    return userOrAdminRoutes.some((route) => path.startsWith(route));
  }
}
