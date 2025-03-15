import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';
import { Brand } from '../brand/brand.entity';
import { User } from '../auth/user.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MinioModule } from '../minio/minio.module'; // Import MinioModule
import { FileUploadController } from '../minio/file-upload.controller'; // Import FileUploadController
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Brand, User]),
    MinioModule,
    AuthModule, // Add MinioModule
  ],
  controllers: [ProductController, FileUploadController], // Add FileUploadController
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
