import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository, Like } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';
import { Brand } from '../brand/brand.entity';
import { User } from '../auth/user.entity';
import { MinioService } from '../minio/minio.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Favorite } from './favorite.entity';

@Injectable()
export class ProductService {
  // Update the constructor in ProductService

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Favorite) // Add this line
    private readonly favoriteRepository: Repository<Favorite>, // Add this line
    private readonly minioService: MinioService,
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
      isPremium?: boolean;
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

    // Check active product count for standard users
    if (user.subscription_type === 'standard') {
      const activeProductCount = await this.productRepository.count({
        where: {
          user: { id: userId },
          status: In(['pending', 'approved']),
        },
      });

      if (activeProductCount >= 15) {
        throw new BadRequestException(
          'Bạn đã đạt giới hạn 15 tin đăng. Vui lòng nâng cấp lên gói Premium hoặc xóa bớt tin đăng.',
        );
      }
    }

    // Validate image URLs (should be from MinIO)
    this.validateMinioImageUrls(productData.images);

    // Calculate expiry date (15 days for premium users, 7 days for standard users)
    const expiryDate = new Date();
    if (
      user.subscription_type === 'premium' ||
      user.subscription_type === 'pro'
    ) {
      expiryDate.setDate(expiryDate.getDate() + 15); // 15 days for premium/pro users
    } else {
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for standard users
    }

    // Tự động đánh dấu tin đăng là premium nếu người dùng có gói premium hoặc pro
    const isPremium =
      productData.isPremium ||
      user.subscription_type === 'premium' ||
      user.subscription_type === 'pro';

    const product = this.productRepository.create({
      ...productData,
      category,
      brand,
      user,
      status: 'pending',
      expiry_date: expiryDate,
      is_premium: isPremium,
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

    // If status is expired, don't allow updates
    if (product.status === 'expired') {
      throw new BadRequestException(
        'Tin đăng đã hết hạn. Vui lòng gia hạn trước khi cập nhật.',
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

      // Reset expiry date based on subscription type
      const expiryDate = new Date();
      if (
        product.user.subscription_type === 'premium' ||
        product.user.subscription_type === 'pro'
      ) {
        expiryDate.setDate(expiryDate.getDate() + 15); // 15 days for premium/pro users
      } else {
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for standard users
      }
      productData.expiry_date = expiryDate;
    }

    // Đảm bảo thuộc tính premium dựa trên gói đăng ký
    if (
      product.user.subscription_type === 'premium' ||
      product.user.subscription_type === 'pro'
    ) {
      productData.is_premium = true;
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

  async getAllProducts(page = 1, limit = 10, includeExpired = false) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition = includeExpired
        ? {}
        : { status: In(['pending', 'approved', 'rejected']) };

      const [products, total] = await this.productRepository.findAndCount({
        where: whereCondition,
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
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new NotFoundException('Could not fetch products');
    }
  }
  async getApprovedProducts(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: Product[]; meta: any }> {
    const skip = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm
    const whereCondition: any = { status: 'approved' };

    // Thêm điều kiện tìm kiếm theo tên nếu có
    if (search && search.trim()) {
      whereCondition.title = Like(`%${search.trim()}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'category', 'brand'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    // Remove sensitive user information
    const sanitizedProducts = products.map((product) => {
      if (product.user) {
        const {
          password,
          role,
          status,
          subscription_type,
          subscription_expiry,
          balance,
          ...userInfo
        } = product.user;
        product.user = userInfo as any;
      }
      return product;
    });

    return {
      data: sanitizedProducts,
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
    status?: 'pending' | 'approved' | 'rejected' | 'expired' | 'hidden',
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
  async renewProduct(productId: number, userId: number) {
    // Find the product
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
      relations: ['user'],
    });

    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to renew this product',
      );
    }

    // Check if the product is expired
    if (product.status !== 'expired') {
      throw new BadRequestException('Only expired products can be renewed');
    }

    // Check if user has reached the product limit (for standard users)
    if (product.user.subscription_type === 'standard') {
      const activeProductCount = await this.productRepository.count({
        where: {
          user: { id: userId },
          status: In(['pending', 'approved']),
        },
      });

      if (activeProductCount >= 15) {
        throw new BadRequestException(
          'Bạn đã đạt giới hạn 15 tin đăng. Vui lòng nâng cấp lên gói Premium hoặc xóa bớt tin đăng.',
        );
      }
    }

    // Set new expiry date based on subscription type
    const expiryDate = new Date();
    if (
      product.user.subscription_type === 'premium' ||
      product.user.subscription_type === 'pro'
    ) {
      expiryDate.setDate(expiryDate.getDate() + 15); // 15 days for premium/pro users
    } else {
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for standard users
    }

    // Update product
    product.status = 'pending'; // Reset to pending for review
    product.expiry_date = expiryDate;

    // Đảm bảo thuộc tính premium dựa trên gói đăng ký
    if (
      product.user.subscription_type === 'premium' ||
      product.user.subscription_type === 'pro'
    ) {
      product.is_premium = true;
    }

    await this.productRepository.save(product);

    return {
      message: 'Product renewed successfully',
      expiryDate: product.expiry_date,
    };
  }
  // Methods for category-related product fetching
  async getProductsByCategory(
    categoryId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: Product[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [products, total] = await this.productRepository.findAndCount({
      where: {
        category: { id: categoryId },
        status: 'approved', // Only return approved products for public API
      },
      relations: ['user', 'category', 'brand'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    // Remove sensitive user information
    const sanitizedProducts = products.map((product) => {
      if (product.user) {
        const { password, role, ...userInfo } = product.user;
        product.user = userInfo as any;
      }
      return product;
    });

    return {
      data: sanitizedProducts,
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

  async getProductsByParentCategory(
    parentCategoryId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: Product[]; meta: any }> {
    const skip = (page - 1) * limit;

    // First, get all child categories of the parent category
    const childCategories = await this.categoryRepository.find({
      where: { parent_id: parentCategoryId },
    });

    // Create array of category IDs including parent and all children
    const categoryIds = [
      parentCategoryId,
      ...childCategories.map((cat) => cat.id),
    ];

    // Query for products in any of these categories
    const [products, total] = await this.productRepository.findAndCount({
      where: {
        category: { id: In(categoryIds) },
        status: 'approved',
      },
      relations: ['user', 'category', 'brand'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    // Remove sensitive user information
    const sanitizedProducts = products.map((product) => {
      if (product.user) {
        const { password, role, ...userInfo } = product.user;
        product.user = userInfo as any;
      }
      return product;
    });

    return {
      data: sanitizedProducts,
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

  // Run Cron job to check expired products every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredProducts() {
    const now = new Date();

    try {
      // Find products that have expired but not marked as expired
      const expiredProducts = await this.productRepository.find({
        where: {
          status: 'approved',
          expiry_date: LessThan(now),
        },
      });

      if (expiredProducts.length > 0) {
        console.log(
          `Found ${expiredProducts.length} products that have expired`,
        );

        // Update status of all expired products
        await Promise.all(
          expiredProducts.map(async (product) => {
            product.status = 'expired';
            return this.productRepository.save(product);
          }),
        );

        console.log('Successfully updated status of expired products');
      }

      // Also check for expired boosted products
      const expiredBoostedProducts = await this.productRepository.find({
        where: {
          is_boosted: true,
          boost_expiry_date: LessThan(now),
        },
      });

      if (expiredBoostedProducts.length > 0) {
        console.log(
          `Found ${expiredBoostedProducts.length} products with expired boost`,
        );

        // Update boost status
        await Promise.all(
          expiredBoostedProducts.map(async (product) => {
            product.is_boosted = false;
            product.boost_expiry_date = null;
            return this.productRepository.save(product);
          }),
        );

        console.log('Successfully updated boost status of products');
      }
    } catch (error) {
      console.error('Error checking for expired products:', error);
    }
  }
  async hideProduct(productId: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
    });

    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to hide this product',
      );
    }

    // Only approved products can be hidden
    if (product.status !== 'approved') {
      throw new BadRequestException('Only approved products can be hidden');
    }

    // Update product status to hidden
    product.status = 'hidden';
    await this.productRepository.save(product);

    return {
      message: 'Product hidden successfully',
      productId,
    };
  }

  async showProduct(productId: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
    });

    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to show this product',
      );
    }

    // Only hidden products can be shown
    if (product.status !== 'hidden') {
      throw new BadRequestException('Only hidden products can be shown');
    }

    // Check if the product is expired
    const now = new Date();
    if (product.expiry_date && product.expiry_date < now) {
      throw new BadRequestException(
        'This product has expired. Please renew it first.',
      );
    }

    // Update product status back to approved
    product.status = 'approved';
    await this.productRepository.save(product);

    return {
      message: 'Product is now visible',
      productId,
    };
  }
  // Add these methods to ProductService class

  async addToFavorites(userId: number, productId: number) {
    // Check if the user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if the product exists and is approved
    const product = await this.productRepository.findOne({
      where: { id: productId, status: 'approved' },
    });
    if (!product)
      throw new NotFoundException('Product not found or not approved');

    // Check if already in favorites
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingFavorite) {
      return {
        message: 'Product is already in favorites',
        favoriteId: existingFavorite.id,
      };
    }

    // Create new favorite
    const favorite = this.favoriteRepository.create({
      user,
      product,
    });

    await this.favoriteRepository.save(favorite);
    return { message: 'Product added to favorites', favoriteId: favorite.id };
  }

  async removeFromFavorites(userId: number, productId: number) {
    const favorite = await this.favoriteRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
    return { message: 'Product removed from favorites', productId };
  }

  async getUserFavorites(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['product', 'product.category', 'product.brand'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    // Map to return just the products
    const products = favorites
      .map((favorite) => favorite.product)
      .filter((product) => product && product.status === 'approved'); // Filter out any removed or non-approved products

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

  async checkIsFavorite(userId: number, productId: number) {
    const favorite = await this.favoriteRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    return { isFavorite: !!favorite };
  }
}
