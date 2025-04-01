import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductBoostDto {
  @ApiProperty({ description: 'ID sản phẩm cần đẩy' })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'ID subscription người dùng', required: false })
  @IsOptional()
  @IsNumber()
  userSubscriptionId?: number;
}

export class UpdateProductBoostDto {
  @ApiProperty({ description: 'Trạng thái hoạt động', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ description: 'Ngày hết hạn', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiry_date?: Date;
}

export class ProductBoostResponseDto {
  @ApiProperty({ description: 'ID' })
  id: number;

  @ApiProperty({ description: 'ID sản phẩm' })
  productId: number;

  @ApiProperty({ description: 'ID người dùng' })
  userId: number;

  @ApiProperty({ description: 'Ngày bắt đầu đẩy tin' })
  boost_date: Date;

  @ApiProperty({ description: 'Ngày hết hạn' })
  expiry_date: Date;

  @ApiProperty({ description: 'Trạng thái hoạt động' })
  is_active: boolean;

  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;
}

export class ProductBoostListDto {
  @ApiProperty({
    description: 'Danh sách các đẩy tin',
    type: [ProductBoostResponseDto],
  })
  data: ProductBoostResponseDto[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
