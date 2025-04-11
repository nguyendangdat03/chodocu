import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';
import { Brand } from '../brand/brand.entity';
import { User } from '../auth/user.entity';
import { Favorite } from './favorite.entity'; // Import the Favorite entity
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MinioModule } from '../minio/minio.module';
import { FileUploadController } from '../minio/file-upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Brand, User, Favorite]), // Add Favorite entity
    MinioModule,
    AuthModule,
  ],
  controllers: [ProductController, FileUploadController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
