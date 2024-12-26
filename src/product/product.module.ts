import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';
import { Brand } from '../brand/brand.entity';
import { User } from '../auth/user.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Brand, User]), // Đăng ký Brand entity
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService], // Nếu cần sử dụng trong module khác
})
export class ProductModule {}
