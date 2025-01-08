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

  @Patch('approve/:productId')
  async approveProduct(
    @Param('productId') productId: number,
    @Body() approveProductDto: ApproveProductDto,
    @Request() req,
  ) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can approve products',
      );
    }
    return this.productService.updateProductStatus(
      productId,
      approveProductDto.status,
    );
  }
  @Patch('reject/:productId') // Route: /admin/products/reject/:productId
  async rejectProduct(@Param('productId') productId: number, @Request() req) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can reject products',
      );
    }

    return this.productService.updateProductStatus(productId, 'rejected');
  }
}
