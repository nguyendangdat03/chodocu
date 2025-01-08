import { ApiProperty } from '@nestjs/swagger';
export class CategoryResponseDto {
  @ApiProperty({ description: 'ID danh mục', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên danh mục', example: 'Electronics' })
  name: string;

  @ApiProperty({
    description: 'ID danh mục cha (hoặc null nếu là danh mục chính)',
    example: null,
  })
  parent_id: number | null;
}
