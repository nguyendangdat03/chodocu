// Import additional decorators
import {
  Controller,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Request,
  ForbiddenException,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can create products');
    }
    return this.productService.createProduct(user_id, createProductDto);
  }

  @Put(':productId')
  async updateProduct(
    @Request() req,
    @Param('productId') productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can update products');
    }
    return this.productService.updateProduct(
      productId,
      user_id,
      updateProductDto,
    );
  }

  @Delete(':productId')
  async deleteProduct(@Request() req, @Param('productId') productId: number) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can delete products');
    }
    return this.productService.deleteProduct(productId, user_id);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get products by current user with optional status filter',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserProducts(
    @Request() req,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { user_id } = req.user;
    return this.productService.getUserProducts(user_id, status, page, limit);
  }
}
