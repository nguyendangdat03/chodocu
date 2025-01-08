import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiProperty } from '@nestjs/swagger';

// approve-product.dto.ts (Nếu cần)
export class ApproveProductDto {
  @ApiProperty({
    description: 'Trạng thái phê duyệt',
    enum: ['approved', 'rejected'],
  })
  status: 'approved' | 'rejected';
}
