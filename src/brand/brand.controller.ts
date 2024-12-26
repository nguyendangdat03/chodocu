import { Controller, Post, Get, Body, Request, ForbiddenException } from '@nestjs/common';
import { BrandService } from './brand.service';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  async createBrand(
    @Request() req,
    @Body('name') name: string,
    @Body('categoryId') categoryId: number,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.brandService.createBrand(name, categoryId);
  }

  @Get(':categoryId')
  async getBrandsByCategory(@Request() req, @Request() categoryId: number) {
    return this.brandService.getBrandsByCategory(categoryId);
  }
}
