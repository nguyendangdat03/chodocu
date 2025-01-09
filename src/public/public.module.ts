import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module'; // Import CategoryModule
@Module({
  imports: [ProductModule, CategoryModule], // Import CategoryModule
  controllers: [PublicController],
})
export class PublicModule {}
