import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './brand.entity';
import { Category } from '../category/category.entity';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Category])],
  providers: [BrandService],
  controllers: [BrandController],
  exports: [TypeOrmModule],
})
export class BrandModule {}
