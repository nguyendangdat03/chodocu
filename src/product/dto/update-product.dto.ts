import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Updated Product Name',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Mô tả sản phẩm',
    example: 'Updated Product Description',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Giá sản phẩm', example: 2000, required: false })
  price?: number;

  @ApiProperty({
    description: 'Danh sách URL ảnh',
    type: [String],
    required: false,
    example: ['image1.jpg', 'image2.jpg'],
  })
  images?: string[];

  @ApiProperty({
    description: 'Tình trạng sản phẩm',
    enum: ['new', 'used'],
    required: false,
  })
  condition?: 'new' | 'used';

  @ApiProperty({ description: 'ID danh mục', example: 2, required: false })
  categoryId?: number;

  @ApiProperty({ description: 'ID thương hiệu', example: 5, required: false })
  brandId?: number;

  @ApiProperty({
    description: 'Địa chỉ',
    example: 'Updated Address',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Thời gian sử dụng',
    example: '6 months',
    required: false,
  })
  usageTime?: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm',
    example: 10,
    required: false,
  })
  quantity?: number;
}
