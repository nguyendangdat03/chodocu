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
  BadRequestException,
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
  @ApiOperation({ summary: 'Create a new product' })
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
  @ApiOperation({ summary: 'Update a product' })
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
  @ApiOperation({ summary: 'Delete a product' })
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
    enum: ['pending', 'approved', 'rejected', 'expired', 'hidden'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserProducts(
    @Request() req,
    @Query('status')
    status?: 'pending' | 'approved' | 'rejected' | 'expired' | 'hidden',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { user_id } = req.user;
    return this.productService.getUserProducts(user_id, status, page, limit);
  }

  @Post(':productId/renew')
  @ApiOperation({ summary: 'Renew an expired product' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async renewProduct(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can renew products');
    }
    return this.productService.renewProduct(productId, user_id);
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired products (Admin or Moderator only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getExpiredProducts(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException('Admin or Moderator access required');
    }
    return this.productService.getUserProducts(user_id, 'expired', page, limit);
  }
  @Post(':productId/hide')
  @ApiOperation({ summary: 'Hide a product from public listings' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async hideProduct(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can hide their products');
    }
    return this.productService.hideProduct(productId, user_id);
  }
  @Post(':productId/show')
  @ApiOperation({ summary: 'Show a previously hidden product' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async showProduct(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can show their products');
    }
    return this.productService.showProduct(productId, user_id);
  }
  // Add these endpoints to ProductController class

  @Post(':productId/favorite')
  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async addToFavorites(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { user_id } = req.user;
    return this.productService.addToFavorites(user_id, productId);
  }

  @Delete(':productId/favorite')
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async removeFromFavorites(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { user_id } = req.user;
    return this.productService.removeFromFavorites(user_id, productId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite products for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserFavorites(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { user_id } = req.user;
    return this.productService.getUserFavorites(user_id, page, limit);
  }

  @Get(':productId/is-favorite')
  @ApiOperation({ summary: 'Check if a product is in user favorites' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async checkIsFavorite(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const { user_id } = req.user;
    return this.productService.checkIsFavorite(user_id, productId);
  }
}
