import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  ForbiddenException,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { ApproveProductDto } from 'src/product/dto/approve-product.dto';

@ApiTags('admin/products')
@Controller('admin/products')
export class AdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts(@Request() req) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can view all products',
      );
    }
    return this.productService.getAllProducts();
  }

  @Patch('update-status/:productId')
  async updateProductStatus(
    @Param('productId') productId: number,
    @Body() approveProductDto: ApproveProductDto, // Chúng ta chỉ cần status trong body
    @Request() req,
  ) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can approve or reject products',
      );
    }
    const { status } = approveProductDto;
    // Kiểm tra trạng thái hợp lệ
    if (status !== 'approved' && status !== 'rejected') {
      throw new ForbiddenException('Invalid status value');
    }
    return this.productService.updateProductStatus(productId, status);
  }
}
