import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../auth/user.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { AdminTransactionController } from '../admin/admin-transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  providers: [TransactionService],
  controllers: [TransactionController, AdminTransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
