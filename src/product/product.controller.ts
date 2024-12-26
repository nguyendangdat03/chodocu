import { Controller, Post, Body, Put, Delete, Param, Request, ForbiddenException } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(
    @Request() req,
    @Body()
    productData: {
      title: string;
      description: string;
      price: number;
      images: string[];
      condition: 'new' | 'used';
      categoryId: number;
      brandId: number;
      address?: string;
      usageTime?: string;
      quantity?: number;
    },
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can create products');
    }

    return this.productService.createProduct(user_id, productData);
  }
  @Put(':productId')
  async updateProduct(
    @Request() req,
    @Param('productId') productId: number,
    @Body() productData: Partial<Product>,
  ) {
    const { role, user_id } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can update products');
    }

    return this.productService.updateProduct(productId, user_id, productData);
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
