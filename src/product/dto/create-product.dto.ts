import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Tên sản phẩm' })
  title: string;

  @ApiProperty({ description: 'Mô tả sản phẩm' })
  description: string;

  @ApiProperty({ description: 'Giá sản phẩm', example: 1000 })
  price: number;

  @ApiProperty({ description: 'Danh sách URL ảnh', type: [String] })
  images: string[];

  @ApiProperty({ description: 'Tình trạng sản phẩm', enum: ['new', 'used'] })
  condition: 'new' | 'used';

  @ApiProperty({ description: 'ID danh mục' })
  categoryId: number;

  @ApiProperty({ description: 'ID thương hiệu' })
  brandId: number;

  @ApiProperty({ description: 'Địa chỉ', required: false })
  address?: string;

  @ApiProperty({ description: 'Thời gian sử dụng', required: false })
  usageTime?: string;

  @ApiProperty({ description: 'Số lượng sản phẩm', required: false })
  quantity?: number;
}
