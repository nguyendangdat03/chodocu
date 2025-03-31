import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { User } from '../auth/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async upgradeToPremuim(userId: number, months: number = 1): Promise<User> {
    // Start a transaction to ensure both balance and subscription are updated together
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has enough balance
      const premiumCost = 99000;
      const currentBalance = Number(user.balance);

      this.logger.log(`User ${userId} current balance: ${currentBalance}`);

      if (currentBalance < premiumCost) {
        throw new BadRequestException(
          `Insufficient balance to upgrade to Premium. Required: ${premiumCost}, Current: ${currentBalance}`,
        );
      }

      // Calculate new subscription expiry date
      let expiryDate: Date;

      if (user.subscription_type === 'premium' && user.subscription_expiry) {
        // If already premium, extend from current expiry date
        expiryDate = new Date(user.subscription_expiry);
      } else {
        // If not premium, start from today
        expiryDate = new Date();
      }

      // Add months to the expiry date
      expiryDate.setMonth(expiryDate.getMonth() + months);

      // Deduct the premium subscription fee from user's balance
      const newBalance = currentBalance - premiumCost;

      // Use direct query to update the user to ensure decimal handling is correct
      await queryRunner.manager.query(
        `UPDATE users SET 
            balance = ?, 
            subscription_type = 'premium', 
            subscription_expiry = ? 
           WHERE id = ?`,
        [newBalance.toFixed(2), expiryDate, userId],
      );

      await queryRunner.commitTransaction();

      // Fetch the updated user to return
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
      });
      this.logger.log(
        `User ${userId} new balance after premium upgrade: ${updatedUser.balance}`,
      );

      return updatedUser;
    } catch (error) {
      // If there's an error, roll back the transaction
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error upgrading subscription: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
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

    // Update user subscription
    user.subscription_type = 'standard';
    user.subscription_expiry = null;

    // Save the updated user
    await this.userRepository.save(user);

    return user;
  }

  async getUserSubscriptionDetails(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      name: user.name,
      subscriptionType: user.subscription_type,
      subscriptionExpiry: user.subscription_expiry,
      isActive:
        user.subscription_type === 'premium' &&
        user.subscription_expiry &&
        new Date(user.subscription_expiry) > new Date(),
      balance: user.balance, // Include balance in the response
    };
  }

  // Cron job to check expired premium subscriptions and downgrade them
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking for expired premium subscriptions...');
    const now = new Date();

    // Find users with expired premium subscriptions
    const expiredUsers = await this.userRepository.find({
      where: {
        subscription_type: 'premium',
        subscription_expiry: LessThan(now),
      },
    });

    if (expiredUsers.length > 0) {
      this.logger.log(
        `Found ${expiredUsers.length} users with expired premium subscriptions`,
      );

      // Downgrade all expired premium users to standard
      await Promise.all(
        expiredUsers.map(async (user) => {
          user.subscription_type = 'standard';
          user.subscription_expiry = null;
          return this.userRepository.save(user);
        }),
      );

      this.logger.log('Expired premium subscriptions downgraded successfully');
    }
  }
}
