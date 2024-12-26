import { Controller, Get, Patch, Param, Request, ForbiddenException } from '@nestjs/common';
import { ProductService } from '../product/product.service';

@Controller('admin/products') // Base path: /admin/products
export class AdminController {
  constructor(private readonly productService: ProductService) {}

  // Lấy tất cả sản phẩm
  @Get()
  async getAllProducts(@Request() req) {
    console.log('Request User:', req.user);
    console.log('Request Admin:', req.admin);

    if (!req.admin || req.admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can view all products');
    }

    return this.productService.getAllProducts();
  }

  // Duyệt sản phẩm
  @Patch('approve/:productId') // Route: /admin/products/approve/:productId
  async approveProduct(@Param('productId') productId: number, @Request() req) {
    console.log('Request Admin:', req.admin);

    if (!req.admin || req.admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can approve products');
    }

    return this.productService.updateProductStatus(productId, 'approved');
  }

  // Từ chối sản phẩm
  @Patch('reject/:productId') // Route: /admin/products/reject/:productId
  async rejectProduct(@Param('productId') productId: number, @Request() req) {
    console.log('Request Admin:', req.admin);

    if (!req.admin || req.admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can reject products');
    }

    return this.productService.updateProductStatus(productId, 'rejected');
  }
}
