import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule], // Import ProductModule để truy cập ProductService
  controllers: [AdminController],
})
export class AdminModule {}
