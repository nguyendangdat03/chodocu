import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from '../transaction/transaction.service';
import { ApproveTransactionDto } from '../transaction/dto/approve-transaction.dto';

@ApiTags('admin/transactions')
@Controller('admin/transactions')
export class AdminTransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all deposit transactions (admin/moderator only)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  async getAllTransactions(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    const userId = req.cookies['user_id'];

    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    if (role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenException(
        'Only admins and moderators can view all transactions',
      );
    }

    // Convert string parameters to numbers
    const pageNumber = parseInt(page.toString(), 10);
    const limitNumber = parseInt(limit.toString(), 10);

    // Cap the limit to prevent performance issues
    const cappedLimit = Math.min(limitNumber, 50);

    return this.transactionService.getAllTransactions(pageNumber, cappedLimit);
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve a deposit transaction (admin only)' })
  async approveTransaction(
    @Param('id') transactionId: number,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    const userId = req.cookies['user_id'];

    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    if (role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to approve transactions',
      );
    }

    return this.transactionService.updateTransactionStatus(
      parseInt(transactionId.toString(), 10),
      parseInt(userId, 10),
      'approved',
    );
  }

  @Patch('reject/:id')
  @ApiOperation({
    summary: 'Reject a deposit transaction with reason (admin only)',
  })
  async rejectTransaction(
    @Param('id') transactionId: number,
    @Body() body: ApproveTransactionDto,
    @Req() req: Request,
  ) {
    const role = req['user']?.role || req.cookies['role'];
    const userId = req.cookies['user_id'];

    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    if (role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to reject transactions',
      );
    }

    if (!body.reason) {
      throw new ForbiddenException('Rejection reason is required');
    }

    return this.transactionService.updateTransactionStatus(
      parseInt(transactionId.toString(), 10),
      parseInt(userId, 10),
      'rejected',
      body.reason,
    );
  }
}
