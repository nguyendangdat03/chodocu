import {
  Controller,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
}
