import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { AdminModule } from './admin/admin.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { PublicModule } from './public/public.module';
import { ChatModule } from './chat/chat.module';
import { MinioModule } from './minio/minio.module';
import { TransactionModule } from './transaction/transaction.module';
import { SubscriptionModule } from './subscription/subscription.module';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available everywhere
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root',
      password: '',
      database: 'chodocu',
      autoLoadEntities: true,
      synchronize: true,
    }),
    // Register MinioModule
    MinioModule,
    AuthModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    AdminModule,
    PublicModule,
    ChatModule,
    TransactionModule, // Add TransactionModule
    SubscriptionModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), AuthMiddleware).forRoutes(
      'products', // API đăng sản phẩm
      'categories', // API quản lý danh mục
      'brands',
      'admin', // API quản lý hãng
      'chat', // Chat routes
      'upload', // Include upload routes to middleware
      'transactions',
      'subscription', // Add transactions routes to middleware
    );
  }
}
