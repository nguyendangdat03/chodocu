import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateMainCategoryDto } from './dto/create-main-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('main')
  async createMainCategory(
    @Request() req,
    @Body() createMainCategoryDto: CreateMainCategoryDto,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.createMainCategory(createMainCategoryDto.name);
  }

  @Post('sub')
  async createSubCategory(
    @Request() req,
    @Body() createSubCategoryDto: CreateSubCategoryDto,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.createSubCategory(
      createSubCategoryDto.name,
      createSubCategoryDto.parentId,
    );
  }

  @Get()
  async getCategories() {
    const categories = await this.categoryService.getCategories();
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
    }));
  }

  @Put(':id')
  async updateCategory(
    @Request() req,
    @Param('id') id: number,
    @Body() updateCategoryDto: CreateMainCategoryDto,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.updateCategory(id, updateCategoryDto.name);
  }

  @Delete(':id')
  async deleteCategory(@Request() req, @Param('id') id: number) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.categoryService.deleteCategory(id);
  }
}
