import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { User } from '../auth/user.entity';
import { SubscriptionPackage } from './subscription-package.entity';
import { UserSubscription } from './user-subscription.entity';
import { ProductBoost } from './product-boost.entity';
import { Product } from '../product/product.entity';
import { SubscriptionPackageService } from './subscription-package.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SubscriptionPackage,
      UserSubscription,
      ProductBoost,
      Product,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionPackageService],
  exports: [SubscriptionService, SubscriptionPackageService],
})
export class SubscriptionModule {}
