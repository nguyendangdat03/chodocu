import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const category = await this.categoryRepository.findOne({
      where: { id: productData.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const brand = await this.brandRepository.findOne({
      where: { id: productData.brandId },
    });
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
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
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
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully', productId };
  }
  async updateProductStatus(
    productId: number,
    userId: number,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ) {
    console.log('Update product status called with:', {
      productId,
      userId,
      status,
      rejectionReason,
    });

    // Bỏ qua việc kiểm tra vai trò ở đây vì đã kiểm tra ở middleware và controller
    // Chỉ cần kiểm tra sự tồn tại của người dùng
    const user = await this.userRepository.findOne({ where: { id: userId } });
    console.log('User found:', user);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['user', 'category', 'brand'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (status === 'rejected' && !rejectionReason) {
      throw new ForbiddenException(
        'Rejection reason is required when rejecting a product',
      );
    }

    product.status = status;
    product.rejection_reason = status === 'rejected' ? rejectionReason : null;

    await this.productRepository.save(product);

    // Remove sensitive user information from response
    if (product.user) {
      const { password, role, ...userInfo } = product.user;
      product.user = userInfo as any;
    }

    return { message: `Product ${status} successfully`, product };
  }

  // Lấy tất cả sản phẩm
  async getAllProducts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [products, total] = await this.productRepository.findAndCount({
        relations: ['user', 'category', 'brand'],
        skip,
        take: limit,
        order: { id: 'DESC' }, // Sort by newest first
      });

      console.log('Fetched Products:', products);

      return {
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new NotFoundException('Could not fetch products');
    }
  }

  // Also update getApprovedProducts with pagination
  async getApprovedProducts(
    page = 1,
    limit = 10,
  ): Promise<{ data: Product[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [products, total] = await this.productRepository.findAndCount({
      where: { status: 'approved' },
      relations: ['user', 'category', 'brand'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id, status: 'approved' },
      relations: ['user', 'category', 'brand'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${id} not found or not approved`,
      );
    }

    // Remove sensitive user information
    if (product.user) {
      const { password, role, ...userInfo } = product.user;
      product.user = userInfo as any;
    }

    return product;
  }
  // Add this method to the ProductService class

  async getUserProducts(
    userId: number,
    status?: 'pending' | 'approved' | 'rejected',
    page = 1,
    limit = 10,
  ) {
    try {
      const where: any = { user: { id: userId } };

      // Add status filter if provided
      if (status) {
        where.status = status;
      }

      const skip = (page - 1) * limit;

      const [products, total] = await this.productRepository.findAndCount({
        where,
        relations: ['category', 'brand'],
        skip,
        take: limit,
        order: { id: 'DESC' }, // Sort by newest first
      });

      return {
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching user products:', error);
      throw new NotFoundException('Could not fetch user products');
    }
  }
}
