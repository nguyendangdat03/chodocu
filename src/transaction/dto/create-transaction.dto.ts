// dto/create-transaction.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Amount to deposit', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method used', example: 'Bank Transfer' })
  @IsNotEmpty()
  @IsString()
  payment_method: string;

  @ApiProperty({
    description: 'Payment details (e.g. bank transfer reference number)',
    example: 'Transfer ref: ABC123456',
  })
  @IsNotEmpty()
  @IsString()
  payment_details: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
