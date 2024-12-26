import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';
import { Brand } from '../brand/brand.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Đảm bảo User entity được inject
  ) {}

  async createProduct(
    userId: number,
    productData: {
      title: string;
      description: string;
      price: number;
      images: string[];
      condition: 'new' | 'used';
      categoryId: number;
      brandId: number;
      address?: string;
      usageTime?: string;
      quantity?: number;
    },
  ) {
    const category = await this.categoryRepository.findOne({ where: { id: productData.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const brand = await this.brandRepository.findOne({ where: { id: productData.brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = this.productRepository.create({
      ...productData,
      category,
      brand,
      user,
      status: 'pending', // Mặc định chờ admin duyệt
    });

    return this.productRepository.save(product);
  }
  async updateProduct(
    productId: number,
    userId: number,
    productData: Partial<Product>,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
    });

    if (!product) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    Object.assign(product, productData);
    return this.productRepository.save(product);
  }

  // Xóa sản phẩm
  async deleteProduct(productId: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
    });

    if (!product) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully', productId };
  }
 // Cập nhật trạng thái sản phẩm
 async updateProductStatus(productId: number, status: 'approved' | 'rejected') {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = status;
    await this.productRepository.save(product);

    return { message: `Product ${status} successfully`, product };
  }

  // Lấy tất cả sản phẩm
  async getAllProducts() {
    try {
      const products = await this.productRepository.find({
        relations: ['user', 'category', 'brand'],
      });
      console.log('Fetched Products:', products);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new NotFoundException('Could not fetch products');
    }
  }
}
