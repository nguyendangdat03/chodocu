import { ApiProperty } from '@nestjs/swagger';
export class CreateMainCategoryDto {
  @ApiProperty({ description: 'Tên danh mục chính', example: 'Electronics' })
  name: string;
}
