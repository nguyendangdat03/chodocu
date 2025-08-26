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

  // Cập nhật thương hiệu
  async updateBrand(id: number, name: string, categoryId: number) {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!brand) throw new Error('Brand not found');

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new Error('Category not found');

    brand.name = name;
    brand.category = category;

    return this.brandRepository.save(brand);
  }

  // Xóa thương hiệu
  async deleteBrand(id: number) {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new Error('Brand not found');

    await this.brandRepository.remove(brand);
    return { message: 'Brand deleted successfully' };
  }

  // Lấy tất cả thương hiệu
  async getAllBrands() {
    return this.brandRepository.find({
      relations: ['category'],
    });
  }
}
