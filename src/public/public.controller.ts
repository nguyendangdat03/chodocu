import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService, // Inject CategoryService
  ) {}

  @Get('products/approved')
  async getPublicApprovedProducts() {
    return this.productService.getApprovedProducts();
  }

  @Get('categories')
  async getCategories() {
    return this.categoryService.getCategories(); // Call the method from CategoryService
  }
}
