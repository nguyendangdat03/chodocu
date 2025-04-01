import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseSubscriptionDto {
  @ApiProperty({ description: 'ID gói đăng ký' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  packageId: number;
}

export class UpgradeToPremiumDto {
  @ApiProperty({ description: 'Số tháng nâng cấp', minimum: 1, maximum: 12 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  months: number;
}

export class BoostProductDto {
  @ApiProperty({ description: 'ID sản phẩm cần đẩy' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;
}

export class SubscriptionDetailsResponseDto {
  @ApiProperty({ description: 'ID người dùng' })
  userId: number;

  @ApiProperty({ description: 'Tên người dùng' })
  name: string;

  @ApiProperty({
    description: 'Loại gói đăng ký',
    enum: ['standard', 'premium'],
  })
  subscriptionType: string;

  @ApiProperty({
    description: 'Ngày hết hạn gói đăng ký',
    required: false,
    nullable: true,
  })
  subscriptionExpiry: Date | null;

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

export class BoostProductResponseDto {
  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;

  @ApiProperty({ description: 'Ngày hết hạn đẩy tin' })
  expiryDate: Date;
}

export class LegacyUpgradeResponseDto {
  @ApiProperty({ description: 'Thông báo thành công' })
  message: string;

  @ApiProperty({
    description: 'Loại gói đăng ký',
    enum: ['standard', 'premium'],
  })
  subscriptionType: string;

  @ApiProperty({ description: 'Ngày hết hạn gói đăng ký', nullable: true })
  subscriptionExpiry: Date | null;

  @ApiProperty({ description: 'Số dư tài khoản' })
  balance: number;
}
