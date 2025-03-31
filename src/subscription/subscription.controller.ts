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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { Request } from 'express';

class UpgradeToPremiumDto {
  months: number;
}

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade to premium subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
  })
  @ApiBody({ type: UpgradeToPremiumDto })
  async upgradeToPremium(
    @Body() upgradeToPremiumDto: UpgradeToPremiumDto,
    @Req() req: Request,
  ) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    // Validate months
    if (upgradeToPremiumDto.months < 1 || upgradeToPremiumDto.months > 12) {
      throw new BadRequestException('Months must be between 1 and 12');
    }

    try {
      const user = await this.subscriptionService.upgradeToPremuim(
        parseInt(userId),
        upgradeToPremiumDto.months,
      );

      this.logger.log(
        `Upgraded user ${userId} to premium for ${upgradeToPremiumDto.months} months. New balance: ${user.balance}`,
      );

      return {
        message: `Subscription upgraded to Premium for ${upgradeToPremiumDto.months} months`,
        subscriptionType: user.subscription_type,
        subscriptionExpiry: user.subscription_expiry,
        balance: user.balance, // Include the updated balance in the response
      };
    } catch (error) {
      this.logger.error(`Error upgrading to premium: ${error.message}`);
      throw error;
    }
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade to standard subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription downgraded successfully',
  })
  async downgradeToStandard(@Req() req: Request) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    const user = await this.subscriptionService.downgradeToStandard(
      parseInt(userId),
    );

    return {
      message: 'Subscription downgraded to Standard',
      subscriptionType: user.subscription_type,
      balance: user.balance, // Include balance in the response
    };
  }

  @Get('details')
  @ApiOperation({ summary: 'Get current user subscription details' })
  @ApiResponse({ status: 200, description: 'Returns subscription details' })
  async getSubscriptionDetails(@Req() req: Request) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    return this.subscriptionService.getUserSubscriptionDetails(
      parseInt(userId),
    );
  }

  // Admin endpoint to manage user subscriptions
  @Post('user/:userId/upgrade')
  @ApiOperation({ summary: 'Upgrade a user to premium (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User subscription upgraded successfully',
  })
  async adminUpgradeUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() upgradeToPremiumDto: UpgradeToPremiumDto,
    @Req() req: Request,
  ) {
    const role = req.cookies['role'];
    if (role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    // Validate months
    if (upgradeToPremiumDto.months < 1 || upgradeToPremiumDto.months > 12) {
      throw new BadRequestException('Months must be between 1 and 12');
    }

    const user = await this.subscriptionService.upgradeToPremuim(
      userId,
      upgradeToPremiumDto.months,
    );

    return {
      message: `User subscription upgraded to Premium for ${upgradeToPremiumDto.months} months`,
      userId: user.id,
      name: user.name,
      subscriptionType: user.subscription_type,
      subscriptionExpiry: user.subscription_expiry,
      balance: user.balance, // Include the updated balance in the response
    };
  }
}
