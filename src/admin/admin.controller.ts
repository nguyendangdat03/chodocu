import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  ForbiddenException,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { ApproveProductDto } from 'src/product/dto/approve-product.dto';

@ApiTags('admin/products')
@Controller('admin/products')
export class AdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products (admin/moderator only)' })
  async getAllProducts(@Request() req) {
    // Lấy thông tin từ req.user như đã thiết lập trong middleware
    const { role, user_id } = req.user;

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can view all products',
      );
    }
    return this.productService.getAllProducts();
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve a product (admin/moderator only)' })
  async approveProduct(@Param('id') productId: number, @Request() req) {
    // Sử dụng user_id thay vì id
    const { role, user_id } = req.user;

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'You do not have permission to approve products',
      );
    }

    return this.productService.updateProductStatus(
      productId,
      parseInt(user_id, 10), // Chuyển đổi sang số nếu cần
      'approved',
    );
  }

  @Patch('reject/:id')
  @ApiOperation({
    summary: 'Reject a product with reason (admin/moderator only)',
  })
  async rejectProduct(
    @Param('id') productId: number,
    @Body() body: ApproveProductDto,
    @Request() req,
  ) {
    // Sử dụng user_id thay vì id
    const { role, user_id } = req.user;

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'You do not have permission to reject products',
      );
    }

    if (!body.reason) {
      throw new ForbiddenException('Rejection reason is required');
    }

    return this.productService.updateProductStatus(
      productId,
      parseInt(user_id, 10), // Chuyển đổi sang số nếu cần
      'rejected',
      body.reason,
    );
  }
}
