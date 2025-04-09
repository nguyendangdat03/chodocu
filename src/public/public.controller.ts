import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Get approved products with optional search by name',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by product name',
  })
  async getPublicApprovedProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    // Convert string parameters to numbers and provide defaults
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;

    // Pass the pagination parameters and search term to the service
    return this.productService.getApprovedProducts(pageNum, limitNum, search);
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
  @Get('categories/:categoryId/products')
  @ApiParam({ name: 'categoryId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductsByCategory(
    @Param('categoryId') categoryId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Convert string parameters to numbers and provide defaults
    const categoryIdNum = parseInt(categoryId.toString(), 10);
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;

    // Pass the pagination parameters to the service
    return this.productService.getProductsByCategory(
      categoryIdNum,
      pageNum,
      limitNum,
    );
  }

  @Get('parent-categories/:categoryId/products')
  @ApiParam({ name: 'categoryId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductsByParentCategory(
    @Param('categoryId') categoryId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Convert string parameters to numbers and provide defaults
    const categoryIdNum = parseInt(categoryId.toString(), 10);
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;

    // Pass the pagination parameters to the service
    return this.productService.getProductsByParentCategory(
      categoryIdNum,
      pageNum,
      limitNum,
    );
  }
}
