import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  ForbiddenException,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { ApproveProductDto } from 'src/product/dto/approve-product.dto';

@ApiTags('admin/products')
@Controller('admin/products')
export class AdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products (admin/moderator only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  async getAllProducts(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    // Lấy thông tin từ req.user như đã thiết lập trong middleware
    const { role, user_id } = req.user;

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can view all products',
      );
    }

    // Convert string parameters to numbers
    const pageNumber = parseInt(page.toString(), 10);
    const limitNumber = parseInt(limit.toString(), 10);

    // Cap the limit to prevent performance issues
    const cappedLimit = Math.min(limitNumber, 50);

    return this.productService.getAllProducts(pageNumber, cappedLimit);
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve a product (admin/moderator only)' })
  async approveProduct(@Param('id') productId: number, @Request() req) {
    const { role, user_id } = req.user;

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'You do not have permission to approve products',
      );
    }

    return this.productService.updateProductStatus(
      productId,
      parseInt(user_id, 10),
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
      parseInt(user_id, 10),
      'rejected',
      body.reason,
    );
  }
}
