import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Request,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  async createBrand(@Request() req, @Body() createBrandDto: CreateBrandDto) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.brandService.createBrand(
      createBrandDto.name,
      createBrandDto.categoryId,
    );
  }

  @Get()
  async getAllBrands() {
    const brands = await this.brandService.getAllBrands();
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      category: {
        id: brand.category.id,
        name: brand.category.name,
      },
    }));
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

  @Put(':id')
  async updateBrand(
    @Request() req,
    @Param('id') id: number,
    @Body() updateBrandDto: CreateBrandDto,
  ) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.brandService.updateBrand(
      id,
      updateBrandDto.name,
      updateBrandDto.categoryId,
    );
  }

  @Delete(':id')
  async deleteBrand(@Request() req, @Param('id') id: number) {
    if (req.cookies.role !== 'admin') {
      throw new ForbiddenException('You do not have admin access');
    }
    return this.brandService.deleteBrand(id);
  }
}
