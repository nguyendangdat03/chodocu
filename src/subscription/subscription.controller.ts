import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UnauthorizedException,
  ParseIntPipe,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPackageService } from './subscription-package.service';
import { Request } from 'express';
import {
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
} from './dto/subscription-package.dto';
import {
  PurchaseSubscriptionDto,
  SubscriptionDetailsResponseDto,
  SubscriptionResponseDto,
  BoostProductDto,
  BoostProductResponseDto,
  UpgradeToPremiumDto,
  LegacyUpgradeResponseDto,
} from './dto/subscription-user.dto';

@ApiTags('subscriptions')
@ApiCookieAuth()
@Controller('subscriptions')
@UsePipes(new ValidationPipe({ transform: true }))
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly packageService: SubscriptionPackageService,
  ) {}

  @Get('packages')
  @ApiOperation({ summary: 'Lấy danh sách gói đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách gói đăng ký có sẵn',
    type: [CreateSubscriptionPackageDto],
  })
  async getAllPackages() {
    return this.packageService.getAllPackages();
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Mua gói đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Mua gói đăng ký thành công',
    type: SubscriptionResponseDto,
  })
  async purchaseSubscription(
    @Body() purchaseDto: PurchaseSubscriptionDto,
    @Req() req: Request,
  ): Promise<SubscriptionResponseDto> {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    try {
      const subscription = await this.subscriptionService.purchaseSubscription(
        parseInt(userId),
        purchaseDto.packageId,
      );

      return {
        message: `Đã mua thành công gói ${subscription.package.name}`,
        subscription: {
          packageName: subscription.package.name,
          expiryDate: subscription.expiry_date,
          remainingBoosts: subscription.remaining_boosts,
        },
        balance: subscription.user.balance,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi mua gói đăng ký: ${error.message}`);
      throw error;
    }
  }

  @Post('boost-product')
  @ApiOperation({ summary: 'Đẩy tin sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Đẩy tin thành công',
    type: BoostProductResponseDto,
  })
  async boostProduct(
    @Body() boostDto: BoostProductDto,
    @Req() req: Request,
  ): Promise<BoostProductResponseDto> {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    try {
      const result = await this.subscriptionService.boostProduct(
        parseInt(userId),
        boostDto.productId,
      );

      return {
        message: 'Đẩy tin thành công',
        expiryDate: result.expiry_date,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi đẩy tin: ${error.message}`);
      throw error;
    }
  }

  @Get('details')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết gói đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết gói đăng ký',
    type: SubscriptionDetailsResponseDto,
  })
  async getSubscriptionDetails(
    @Req() req: Request,
  ): Promise<SubscriptionDetailsResponseDto> {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    return this.subscriptionService.getUserSubscriptionDetails(
      parseInt(userId),
    );
  }

  // Các API Legacy
  @Post('upgrade')
  @ApiOperation({ summary: 'Nâng cấp lên gói Premium (Legacy)' })
  @ApiResponse({
    status: 200,
    description: 'Nâng cấp thành công',
    type: LegacyUpgradeResponseDto,
  })
  async upgradeToPremium(
    @Body() upgradeDto: UpgradeToPremiumDto,
    @Req() req: Request,
  ): Promise<LegacyUpgradeResponseDto> {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    try {
      const user = await this.subscriptionService.upgradeToPremuim(
        parseInt(userId),
        upgradeDto.months,
      );

      this.logger.log(
        `Đã nâng cấp người dùng ${userId} lên Premium trong ${upgradeDto.months} tháng. Số dư mới: ${user.balance}`,
      );

      return {
        message: `Đã nâng cấp lên gói Premium trong ${upgradeDto.months} tháng`,
        subscriptionType: user.subscription_type,
        subscriptionExpiry: user.subscription_expiry,
        balance: user.balance,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi nâng cấp lên Premium: ${error.message}`);
      throw error;
    }
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Hạ cấp xuống gói Standard (Legacy)' })
  @ApiResponse({
    status: 200,
    description: 'Hạ cấp thành công',
    type: LegacyUpgradeResponseDto,
  })
  async downgradeToStandard(
    @Req() req: Request,
  ): Promise<LegacyUpgradeResponseDto> {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    const user = await this.subscriptionService.downgradeToStandard(
      parseInt(userId),
    );

    return {
      message: 'Đã hạ cấp xuống gói Standard',
      subscriptionType: user.subscription_type,
      subscriptionExpiry: null,
      balance: user.balance,
    };
  }

  // Các API dành cho Admin
  @Post('packages')
  @ApiOperation({ summary: 'Tạo gói đăng ký mới (Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo gói thành công',
    type: CreateSubscriptionPackageDto,
  })
  async createPackage(
    @Body() packageData: CreateSubscriptionPackageDto,
    @Req() req: Request,
  ) {
    const role = req.cookies['role'];
    if (role !== 'admin') {
      throw new UnauthorizedException('Yêu cầu quyền Admin');
    }

    return this.packageService.createPackage(packageData);
  }

  @Post('packages/:id')
  @ApiOperation({ summary: 'Cập nhật gói đăng ký (Admin)' })
  @ApiParam({ name: 'id', description: 'ID gói đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật gói thành công',
    type: UpdateSubscriptionPackageDto,
  })
  async updatePackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() packageData: UpdateSubscriptionPackageDto,
    @Req() req: Request,
  ) {
    const role = req.cookies['role'];
    if (role !== 'admin') {
      throw new UnauthorizedException('Yêu cầu quyền Admin');
    }

    return this.packageService.updatePackage(id, packageData);
  }

  @Post('packages/:id/deactivate')
  @ApiOperation({ summary: 'Vô hiệu hóa gói đăng ký (Admin)' })
  @ApiParam({ name: 'id', description: 'ID gói đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Vô hiệu hóa gói thành công',
  })
  async deactivatePackage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const role = req.cookies['role'];
    if (role !== 'admin') {
      throw new UnauthorizedException('Yêu cầu quyền Admin');
    }

    await this.packageService.deactivatePackage(id);
    return { message: 'Đã vô hiệu hóa gói thành công' };
  }
}
