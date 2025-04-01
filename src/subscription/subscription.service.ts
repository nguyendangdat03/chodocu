import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource, MoreThan } from 'typeorm';
import { User } from '../auth/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionPackage } from './subscription-package.entity';
import { UserSubscription } from './user-subscription.entity';
import { ProductBoost } from './product-boost.entity';
import { Product } from '../product/product.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPackage)
    private readonly packageRepository: Repository<SubscriptionPackage>,
    @InjectRepository(ProductBoost)
    private readonly productBoostRepository: Repository<ProductBoost>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}
  async purchaseSubscription(
    userId: number,
    packageId: number,
  ): Promise<UserSubscription> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Find the package
      const subscriptionPackage = await this.packageRepository.findOne({
        where: { id: packageId, is_active: true },
      });

      if (!subscriptionPackage) {
        throw new NotFoundException(
          'Subscription package not found or inactive',
        );
      }

      // Check if user has enough balance
      const packageCost = Number(subscriptionPackage.price);
      const currentBalance = Number(user.balance);

      this.logger.log(`User ${userId} current balance: ${currentBalance}`);

      if (currentBalance < packageCost) {
        throw new BadRequestException(
          `Insufficient balance to purchase this package. Required: ${packageCost}, Current: ${currentBalance}`,
        );
      }

      // Calculate new subscription expiry date
      let expiryDate = new Date();

      // Check if user already has an active subscription of the same type
      const existingSubscription =
        await this.userSubscriptionRepository.findOne({
          where: {
            user: { id: userId },
            package: { id: packageId },
            is_active: true,
            expiry_date: MoreThan(new Date()), // Sửa thành MoreThan để tìm các gói còn hiệu lực
          },
          relations: ['package'],
        });

      if (existingSubscription) {
        // Extend from current expiry date
        expiryDate = new Date(existingSubscription.expiry_date);
      }

      // Add days to the expiry date
      expiryDate.setDate(
        expiryDate.getDate() + subscriptionPackage.duration_days,
      );

      // Deduct the subscription fee from user's balance
      const newBalance = currentBalance - packageCost;

      // Xác định subscription_type dựa trên package name thay vì chỉ dựa vào is_premium
      let subscriptionType = 'standard';
      if (subscriptionPackage.is_premium) {
        subscriptionType =
          subscriptionPackage.boost_slots > 0 ? 'pro' : 'premium';
      }

      // Update user's balance and subscription information
      await queryRunner.manager.query(
        `UPDATE users SET 
            balance = ?, 
            subscription_type = ?, 
            subscription_expiry = ? 
         WHERE id = ?`,
        [
          newBalance.toFixed(2),
          subscriptionType, // Sử dụng giá trị mới
          expiryDate,
          userId,
        ],
      );

      // Create or update user subscription record
      let userSubscription: UserSubscription;

      if (existingSubscription) {
        // Update existing subscription
        existingSubscription.expiry_date = expiryDate;
        existingSubscription.remaining_boosts +=
          subscriptionPackage.boost_slots;
        userSubscription = await queryRunner.manager.save(existingSubscription);
      } else {
        // Create new subscription
        userSubscription = queryRunner.manager.create(UserSubscription, {
          user: { id: userId },
          package: { id: packageId },
          start_date: new Date(),
          expiry_date: expiryDate,
          remaining_boosts: subscriptionPackage.boost_slots,
          is_active: true,
        });
        userSubscription = await queryRunner.manager.save(userSubscription);
      }

      await queryRunner.commitTransaction();

      // Fetch the updated user subscription to return
      return this.userSubscriptionRepository.findOne({
        where: { id: userSubscription.id },
        relations: ['user', 'package'],
      });
    } catch (error) {
      // If there's an error, roll back the transaction
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error purchasing subscription: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
  async boostProduct(userId: number, productId: number): Promise<ProductBoost> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the user's active pro subscription
      const userSubscription = await this.userSubscriptionRepository.findOne({
        where: {
          user: { id: userId },
          is_active: true,
          expiry_date: MoreThan(new Date()), // Sửa thành MoreThan để tìm các gói còn hiệu lực
          remaining_boosts: MoreThan(0), // Sửa thành MoreThan để tìm các gói còn boost
        },
        relations: ['package'],
      });

      if (!userSubscription || !userSubscription.package.boost_slots) {
        throw new BadRequestException(
          'You need an active Pro subscription with available boost slots to boost products',
        );
      }

      // Find the product
      const product = await this.productRepository.findOne({
        where: { id: productId, user: { id: userId }, status: 'approved' },
      });

      if (!product) {
        throw new NotFoundException(
          'Product not found or not eligible for boosting. Products must be approved to be boosted.',
        );
      }

      // Check if product is already boosted
      if (product.is_boosted) {
        throw new BadRequestException('This product is already boosted');
      }

      // Calculate boost expiry (7 days from now)
      const boostExpiryDate = new Date();
      boostExpiryDate.setDate(boostExpiryDate.getDate() + 7);

      // Create boost record
      const productBoost = queryRunner.manager.create(ProductBoost, {
        product: { id: productId },
        user: { id: userId },
        userSubscription: { id: userSubscription.id },
        boost_date: new Date(),
        expiry_date: boostExpiryDate,
        is_active: true,
      });

      await queryRunner.manager.save(productBoost);

      // Update product to mark as boosted
      await queryRunner.manager.query(
        `UPDATE products SET 
            is_boosted = TRUE, 
            boost_expiry_date = ? 
         WHERE id = ?`,
        [boostExpiryDate, productId],
      );

      // Decrement user's remaining boost slots
      userSubscription.remaining_boosts -= 1;
      userSubscription.total_boosts_used += 1;
      await queryRunner.manager.save(userSubscription);

      await queryRunner.commitTransaction();

      return productBoost;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error boosting product: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserSubscriptionDetails(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get active subscriptions
    const activeSubscriptions = await this.userSubscriptionRepository.find({
      where: {
        user: { id: userId },
        is_active: true,
      },
      relations: ['package'],
      order: {
        expiry_date: 'DESC',
      },
    });

    return {
      userId: user.id,
      name: user.name,
      subscriptionType: user.subscription_type,
      subscriptionExpiry: user.subscription_expiry,
      isActive:
        user.subscription_type === 'premium' &&
        user.subscription_expiry &&
        new Date(user.subscription_expiry) > new Date(),
      balance: user.balance,
      subscriptions: activeSubscriptions.map((sub) => ({
        packageName: sub.package.name,
        expiryDate: sub.expiry_date,
        remainingBoosts: sub.remaining_boosts,
        totalBoostsUsed: sub.total_boosts_used,
      })),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions and boosts...');
    const now = new Date();

    // Check expired user subscriptions
    const expiredUserSubscriptions = await this.userSubscriptionRepository.find(
      {
        where: {
          is_active: true,
          expiry_date: LessThan(now),
        },
        relations: ['user'],
      },
    );

    if (expiredUserSubscriptions.length > 0) {
      this.logger.log(
        `Found ${expiredUserSubscriptions.length} expired user subscriptions`,
      );

      for (const subscription of expiredUserSubscriptions) {
        subscription.is_active = false;
        await this.userSubscriptionRepository.save(subscription);

        // Check if user has any other active subscriptions
        const hasActiveSubscriptions =
          await this.userSubscriptionRepository.count({
            where: {
              user: { id: subscription.user.id },
              is_active: true,
              expiry_date: LessThan(now),
            },
          });

        // If no active subscriptions, downgrade user to standard
        if (hasActiveSubscriptions === 0) {
          await this.userRepository.update(
            { id: subscription.user.id },
            {
              subscription_type: 'standard',
              subscription_expiry: null,
            },
          );
        }
      }
    }

    // Check expired product boosts
    const expiredBoosts = await this.productBoostRepository.find({
      where: {
        is_active: true,
        expiry_date: LessThan(now),
      },
      relations: ['product'],
    });

    if (expiredBoosts.length > 0) {
      this.logger.log(`Found ${expiredBoosts.length} expired product boosts`);

      for (const boost of expiredBoosts) {
        // Mark boost as inactive
        boost.is_active = false;
        await this.productBoostRepository.save(boost);

        // Update product status
        if (boost.product) {
          await this.productRepository.update(
            { id: boost.product.id },
            {
              is_boosted: false,
              boost_expiry_date: null,
            },
          );
        }
      }
    }
  }

  // Legacy methods for backward compatibility
  async upgradeToPremuim(userId: number, months: number = 1): Promise<User> {
    // Find Premium package
    const premiumPackage = await this.packageRepository.findOne({
      where: { name: 'Premium', is_active: true },
    });

    if (!premiumPackage) {
      throw new NotFoundException('Premium package not found');
    }

    // Purchase subscription using the new method
    await this.purchaseSubscription(userId, premiumPackage.id);

    // Return updated user
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async downgradeToStandard(userId: number): Promise<User> {
    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already standard
    if (user.subscription_type === 'standard') {
      throw new BadRequestException('User already has a standard subscription');
    }

    // Deactivate all user subscriptions
    await this.userSubscriptionRepository.update(
      { user: { id: userId }, is_active: true },
      { is_active: false },
    );

    // Update user subscription
    user.subscription_type = 'standard';
    user.subscription_expiry = null;

    // Save the updated user
    await this.userRepository.save(user);

    return user;
  }
}
