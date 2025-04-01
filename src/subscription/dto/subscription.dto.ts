import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsPositive,
} from 'class-validator';

/**
 * DTOs cho gói đăng ký
 */
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

/**
 * DTOs cho đăng ký dịch vụ
 */
export class PurchaseSubscriptionDto {
  @ApiProperty({ description: 'ID gói đăng ký' })
  @IsNotEmpty()
  @IsNumber()
  packageId: number;
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;

  @ApiProperty({ description: 'Thông tin gói đăng ký' })
  subscription: {
    packageName: string;
    expiryDate: Date;
    remainingBoosts: number;
  };

  @ApiProperty({ description: 'Số dư tài khoản' })
  balance: number;
}

export class SubscriptionDetailsDto {
  @ApiProperty({ description: 'ID người dùng' })
  userId: number;

  @ApiProperty({ description: 'Tên người dùng' })
  name: string;

  @ApiProperty({
    description: 'Loại gói đăng ký',
    enum: ['standard', 'premium'],
  })
  subscriptionType: string;

  @ApiProperty({ description: 'Ngày hết hạn gói đăng ký', required: false })
  subscriptionExpiry: Date;

  @ApiProperty({ description: 'Trạng thái gói đăng ký' })
  isActive: boolean;

  @ApiProperty({ description: 'Số dư tài khoản' })
  balance: number;

  @ApiProperty({ description: 'Danh sách các gói đăng ký hoạt động' })
  subscriptions: Array<{
    packageName: string;
    expiryDate: Date;
    remainingBoosts: number;
    totalBoostsUsed: number;
  }>;
}

/**
 * DTOs cho đẩy tin
 */
export class BoostProductDto {
  @ApiProperty({ description: 'ID sản phẩm cần đẩy' })
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}

export class BoostProductResponseDto {
  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;

  @ApiProperty({ description: 'Ngày hết hạn đẩy tin' })
  expiryDate: Date;
}

/**
 * DTOs cho gói legacy
 */
export class UpgradeToPremiumDto {
  @ApiProperty({ description: 'Số tháng nâng cấp', minimum: 1, maximum: 12 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  months: number;
}

export class LegacyUpgradeResponseDto {
  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;

  @ApiProperty({
    description: 'Loại gói đăng ký',
    enum: ['standard', 'premium'],
  })
  subscriptionType: string;

  @ApiProperty({ description: 'Ngày hết hạn gói đăng ký' })
  subscriptionExpiry: Date;

  @ApiProperty({ description: 'Số dư tài khoản' })
  balance: number;
}
