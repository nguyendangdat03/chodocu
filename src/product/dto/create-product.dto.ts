import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsPositive,
  IsUrl,
  MinLength,
  MaxLength,
  ArrayMinSize,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 12 Pro' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'Like new iPhone 12 Pro, 128GB, Pacific Blue color' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 799.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: [
      'http://127.0.0.1:9000/product-images/1647289410000-123456789.jpg',
      'http://127.0.0.1:9000/product-images/1647289420000-987654321.jpg',
    ],
    description: 'Array of image URLs from MinIO storage',
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMinSize(1)
  images: string[];

  @ApiProperty({ enum: ['new', 'used'], example: 'used' })
  @IsEnum(['new', 'used'])
  condition: 'new' | 'used';

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  categoryId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  brandId: number;

  @ApiProperty({ example: 'New York, NY', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ example: '6 months', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  usageTime?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;
}
