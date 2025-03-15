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
import { MinioService } from '../minio/minio.service';

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
    private readonly userRepository: Repository<User>,
    private readonly minioService: MinioService, // Inject MinioService
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

    // Validate image URLs (should be from MinIO)
    this.validateMinioImageUrls(productData.images);

    const product = this.productRepository.create({
      ...productData,
      category,
      brand,
      user,
      status: 'pending',
    });

    return this.productRepository.save(product);
  }

  // Helper method to validate MinIO image URLs
  private validateMinioImageUrls(images: string[]): void {
    if (!images || images.length === 0) {
      throw new ForbiddenException('At least one product image is required');
    }

    // Get MinIO endpoint from the service
    const minioEndpoint = this.minioService.getMinioPublicEndpoint();

    // Check if all image URLs are from our MinIO server
    const invalidUrls = images.filter((url) => !url.startsWith(minioEndpoint));
    if (invalidUrls.length > 0) {
      throw new ForbiddenException(
        'All images must be uploaded through our storage service',
      );
    }
  }

  // Extract object name from MinIO URL
  private getObjectNameFromUrl(url: string): string {
    // Parse the URL to extract the object name
    try {
      const urlObj = new URL(url);
      // Extract the path without the bucket name
      const pathParts = urlObj.pathname.split('/');
      // Skip the first empty segment and the bucket name
      return pathParts.slice(2).join('/');
    } catch (error) {
      console.error('Error parsing URL:', error);
      return '';
    }
  }

  async updateProduct(
    productId: number,
    userId: number,
    productData: Partial<Product>,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
      relations: ['user'],
    });

    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    // If updating images, validate the new images
    if (productData.images) {
      this.validateMinioImageUrls(productData.images);

      // Delete old images that are not in the new list
      const oldImages = product.images || [];
      const imagesToDelete = oldImages.filter(
        (oldUrl) => !productData.images.includes(oldUrl),
      );

      // Delete unused images from MinIO
      await Promise.all(
        imagesToDelete.map(async (url) => {
          const objectName = this.getObjectNameFromUrl(url);
          if (objectName) {
            try {
              await this.minioService.deleteFile(objectName);
            } catch (error) {
              console.error(`Failed to delete image ${url}:`, error);
            }
          }
        }),
      );
    }

    // Reset product status to pending if certain fields are updated
    if (
      productData.title ||
      productData.description ||
      productData.price ||
      productData.images ||
      productData.condition
    ) {
      productData.status = 'pending';
    }

    Object.assign(product, productData);
    return this.productRepository.save(product);
  }

  async deleteProduct(productId: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
    });

    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    // Delete product images from MinIO
    const images = product.images || [];
    await Promise.all(
      images.map(async (url) => {
        const objectName = this.getObjectNameFromUrl(url);
        if (objectName) {
          try {
            await this.minioService.deleteFile(objectName);
          } catch (error) {
            console.error(`Failed to delete image ${url}:`, error);
          }
        }
      }),
    );

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully', productId };
  }

  // Rest of the methods remain unchanged
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

  async getAllProducts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [products, total] = await this.productRepository.findAndCount({
        relations: ['user', 'category', 'brand'],
        skip,
        take: limit,
        order: { id: 'DESC' },
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

  async getUserProducts(
    userId: number,
    status?: 'pending' | 'approved' | 'rejected',
    page = 1,
    limit = 10,
  ) {
    try {
      const where: any = { user: { id: userId } };

      if (status) {
        where.status = status;
      }

      const skip = (page - 1) * limit;

      const [products, total] = await this.productRepository.findAndCount({
        where,
        relations: ['category', 'brand'],
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
    } catch (error) {
      console.error('Error fetching user products:', error);
      throw new NotFoundException('Could not fetch user products');
    }
  }
}
