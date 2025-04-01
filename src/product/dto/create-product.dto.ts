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
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ description: 'Tiêu đề sản phẩm' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mô tả sản phẩm' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Giá sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'URL hình ảnh sản phẩm', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Tình trạng sản phẩm', enum: ['new', 'used'] })
  @IsEnum(['new', 'used'])
  condition: 'new' | 'used';

  @ApiProperty({ description: 'ID danh mục' })
  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @ApiProperty({ description: 'ID thương hiệu' })
  @IsNumber()
  @Type(() => Number)
  brandId: number;

  @ApiPropertyOptional({ description: 'Địa chỉ sản phẩm' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Thời gian sử dụng (đối với sản phẩm đã qua sử dụng)',
  })
  @IsOptional()
  @IsString()
  usageTime?: string;

  @ApiPropertyOptional({ description: 'Số lượng sản phẩm', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Đánh dấu là tin đăng premium',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
