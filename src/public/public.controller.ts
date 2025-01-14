import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { BrandService } from '../brand/brand.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly productService: ProductService,
    private readonly brandService: BrandService,
    private readonly categoryService: CategoryService, // Inject BrandService
  ) {}

  @Get('products/approved')
  async getPublicApprovedProducts() {
    return this.productService.getApprovedProducts();
  }

  @Get('categories')
  async getCategories() {
    return this.categoryService.getCategories(); // Call the method from CategoryService
  }
  @Get(':categoryId')
  async getBrandsByCategory(@Param('categoryId') categoryId: number) {
    const brands = await this.brandService.getBrandsByCategory(categoryId);
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      category: {
        id: brand.category.id,
        name: brand.category.name,
      },
    }));
  }
}
