import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { BrandService } from '../brand/brand.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly productService: ProductService,
    private readonly brandService: BrandService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get('products/approved')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPublicApprovedProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Convert string parameters to numbers and provide defaults
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;

    // Pass the pagination parameters to the service
    return this.productService.getApprovedProducts(pageNum, limitNum);
  }

  @Get('categories')
  async getCategories() {
    return this.categoryService.getCategories();
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

  @Get('products/:id')
  async getProductById(@Param('id') id: number) {
    return this.productService.getProductById(id);
  }
}
