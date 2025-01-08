import { ApiProperty } from '@nestjs/swagger';
export class CreateSubCategoryDto {
  @ApiProperty({ description: 'Tên danh mục con', example: 'Mobile Phones' })
  name: string;

  @ApiProperty({ description: 'ID của danh mục chính', example: 1 })
  parentId: number;
}
