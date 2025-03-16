import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createTransaction(
    userId: number,
    transactionData: {
      amount: number;
      payment_method: string;
      payment_details: string;
      notes?: string;
    },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const transaction = this.transactionRepository.create({
      ...transactionData,
      user,
      status: 'not_paid',
    });

    return this.transactionRepository.save(transaction);
  }

  async getAllTransactions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        relations: ['user'],
        skip,
        take: limit,
        order: { id: 'DESC' },
      },
    );

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getUserTransactions(
    userId: number,
    status?: 'not_paid' | 'pending' | 'approved' | 'rejected',
    page = 1,
    limit = 10,
  ) {
    const where: any = { user: { id: userId } };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where,
        relations: ['user'],
        skip,
        take: limit,
        order: { id: 'DESC' },
      },
    );

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateTransactionStatus(
    transactionId: number,
    adminId: number,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ) {
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (status === 'rejected' && !rejectionReason) {
      throw new ForbiddenException(
        'Rejection reason is required when rejecting a transaction',
      );
    }

    // If approving, add the amount to the user's balance
    if (status === 'approved') {
      const user = await this.userRepository.findOne({
        where: { id: transaction.user.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.balance = Number(user.balance || 0) + Number(transaction.amount);
      await this.userRepository.save(user);
    }

    transaction.status = status;
    transaction.rejection_reason =
      status === 'rejected' ? rejectionReason : null;

    await this.transactionRepository.save(transaction);

    // Remove sensitive user information from response
    if (transaction.user) {
      const { password, role, ...userInfo } = transaction.user;
      transaction.user = userInfo as any;
    }

    return {
      message: `Transaction ${status} successfully`,
      transaction,
      ...(status === 'approved'
        ? {
            newBalance: transaction.user.balance,
          }
        : {}),
    };
  }

  // New method to update transaction status from not_paid to pending after successful payment
  async updatePaymentStatus(transactionId: number, status: 'pending') {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (transaction.status !== 'not_paid') {
      throw new ForbiddenException(
        'Only transactions with "not_paid" status can be updated to "pending"',
      );
    }

    transaction.status = status;
    await this.transactionRepository.save(transaction);

    // Remove sensitive user information from response
    if (transaction.user) {
      const { password, role, ...userInfo } = transaction.user;
      transaction.user = userInfo as any;
    }

    return {
      success: true,
      message: 'Transaction status updated to pending successfully',
      transaction,
    };
  }

  async getTransactionById(id: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Remove sensitive user information
    if (transaction.user) {
      const { password, role, ...userInfo } = transaction.user;
      transaction.user = userInfo as any;
    }

    return transaction;
  }
}
