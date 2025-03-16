import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UnauthorizedException,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deposit request' })
  @ApiBody({ type: CreateTransactionDto })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: Request,
  ) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }
    return this.transactionService.createTransaction(
      parseInt(userId, 10),
      createTransactionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get current user transactions' })
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['not_paid', 'pending', 'approved', 'rejected'],
    description: 'Filter by status',
  })
  async getUserTransactions(
    @Req() req: Request,
    @Query('status') status?: 'not_paid' | 'pending' | 'approved' | 'rejected',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }
    return this.transactionService.getUserTransactions(
      parseInt(userId, 10),
      status,
      parseInt(page.toString(), 10),
      parseInt(limit.toString(), 10),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransactionById(@Param('id') id: number, @Req() req: Request) {
    const userId = req.cookies['user_id'];
    const role = req.cookies['role'];

    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    // Check if user is trying to access their own transaction or is an admin/moderator
    // Allow admin/moderator to view any transaction, otherwise only show user's own transactions
    const transaction = await this.transactionService.getTransactionById(
      parseInt(id.toString(), 10),
    );

    if (
      role !== 'admin' &&
      role !== 'moderator' &&
      transaction.user.id !== parseInt(userId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this transaction',
      );
    }

    return transaction;
  }

  @Post(':id/update-status')
  @ApiOperation({ summary: 'Update transaction status after payment' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'Transaction ID',
  })
  @ApiBody({ type: UpdateTransactionStatusDto })
  async updateTransactionStatus(
    @Param('id') id: number,
    @Body() updateStatusDto: UpdateTransactionStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.cookies['user_id'];
    if (!userId) {
      throw new UnauthorizedException('Not logged in');
    }

    // Get the transaction
    const transaction = await this.transactionService.getTransactionById(
      parseInt(id.toString(), 10),
    );

    // Verify user owns this transaction
    if (transaction.user.id !== parseInt(userId)) {
      throw new ForbiddenException(
        'You do not have permission to update this transaction',
      );
    }

    // Only allow updating from not_paid to pending
    if (
      transaction.status !== 'not_paid' ||
      updateStatusDto.status !== 'pending'
    ) {
      throw new ForbiddenException(
        'Invalid status transition. Only not_paid to pending is allowed.',
      );
    }

    return this.transactionService.updatePaymentStatus(
      parseInt(id.toString(), 10),
      updateStatusDto.status,
    );
  }
}
