import { Controller, Post, Body, Request, ForbiddenException } from '@nestjs/common';
import { ProductService } from './product.service';

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
}
