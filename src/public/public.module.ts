import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { BrandModule } from 'src/brand/brand.module'; // Import CategoryModule
@Module({
  imports: [ProductModule, CategoryModule, BrandModule], // Import CategoryModule
  controllers: [PublicController],
})
export class PublicModule {}
