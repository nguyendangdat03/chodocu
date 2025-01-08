import { ApiProperty } from '@nestjs/swagger';
export class CreateBrandDto {
  @ApiProperty({ description: 'Tên thương hiệu', example: 'Apple' })
  name: string;

  @ApiProperty({ description: 'ID của danh mục', example: 1 })
  categoryId: number;
}
