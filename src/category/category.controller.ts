import { Controller, Post, Get, Body, Request, ForbiddenException } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('main')
  async createMainCategory(@Request() req, @Body('name') name: string) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.createMainCategory(name);
  }

  @Post('sub')
  async createSubCategory(
    @Request() req,
    @Body('name') name: string,
    @Body('parentId') parentId: number,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.createSubCategory(name, parentId);
  }

  @Get()
  async getCategories() {
    return this.categoryService.getCategories();
  }
}
