import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Product description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Product price' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Product images URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Product condition', enum: ['new', 'used'] })
  @IsEnum(['new', 'used'])
  condition: 'new' | 'used';

  @ApiProperty({ description: 'Category ID' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ description: 'Brand ID' })
  @IsNumber()
  brandId: number;

  @ApiPropertyOptional({ description: 'Product address/location' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Usage time (for used products)' })
  @IsOptional()
  @IsString()
  usageTime?: string;

  @ApiPropertyOptional({ description: 'Product quantity', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Is premium listing', default: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
