import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Tạo danh mục chính
  async createMainCategory(name: string) {
    const category = this.categoryRepository.create({ name, parent_id: null });
    return this.categoryRepository.save(category);
  }

  // Tạo danh mục con
  async createSubCategory(name: string, parentId: number) {
    const category = this.categoryRepository.create({ name, parent_id: parentId });
    return this.categoryRepository.save(category);
  }

  // Lấy tất cả danh mục
  async getCategories() {
    return this.categoryRepository.find();
  }
}
