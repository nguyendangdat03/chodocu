import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateSubscriptionPackageDto {
  @ApiProperty({ description: 'Tên gói đăng ký' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Mô tả gói đăng ký' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Giá gói đăng ký' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'Thời hạn gói (ngày)' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  duration_days: number;

  @ApiProperty({ description: 'Số lượt đẩy tin', default: 0 })
  @IsNumber()
  @Min(0)
  boost_slots: number;

  @ApiProperty({ description: 'Có phải gói premium không', default: false })
  @IsBoolean()
  is_premium: boolean;
}

export class UpdateSubscriptionPackageDto {
  @ApiProperty({ description: 'Tên gói đăng ký', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Mô tả gói đăng ký', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Giá gói đăng ký', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({ description: 'Thời hạn gói (ngày)', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  duration_days?: number;

  @ApiProperty({ description: 'Số lượt đẩy tin', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  boost_slots?: number;

  @ApiProperty({ description: 'Có phải gói premium không', required: false })
  @IsOptional()
  @IsBoolean()
  is_premium?: boolean;

  @ApiProperty({ description: 'Trạng thái hoạt động', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
