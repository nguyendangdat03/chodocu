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
    const category = this.categoryRepository.create({
      name,
      parent_id: parentId,
    });
    return this.categoryRepository.save(category);
  }

  // Lấy tất cả danh mục
  async getCategories() {
    return this.categoryRepository.find();
  }

  // Cập nhật danh mục
  async updateCategory(id: number, name: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');

    category.name = name;
    return this.categoryRepository.save(category);
  }

  // Xóa danh mục
  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');

    // Kiểm tra xem danh mục có các danh mục con không
    const childCategories = await this.categoryRepository.find({
      where: { parent_id: id },
    });
    if (childCategories.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Kiểm tra xem danh mục có brands không
    const brands = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.brands', 'brand')
      .where('category.id = :id', { id })
      .getOne();

    if (brands && brands.brands && brands.brands.length > 0) {
      throw new Error('Cannot delete category with associated brands');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
