import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from '../category/category.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Tạo hãng
  async createBrand(name: string, categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new Error('Category not found');

    const brand = this.brandRepository.create({ name, category });
    return this.brandRepository.save(brand);
  }

  // Lấy tất cả hãng theo danh mục
  async getBrandsByCategory(categoryId: number) {
    // Kiểm tra danh mục có tồn tại
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new Error('Category not found');
    }

    // Truy vấn thương hiệu với liên kết danh mục
    return this.brandRepository.find({
      where: { category: { id: categoryId } },
      relations: ['category'], // Đảm bảo lấy thông tin liên quan
    });
  }
}
