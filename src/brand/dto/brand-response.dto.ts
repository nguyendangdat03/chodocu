import { ApiProperty } from '@nestjs/swagger';
export class BrandResponseDto {
  @ApiProperty({ description: 'ID thương hiệu', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên thương hiệu', example: 'Apple' })
  name: string;

  @ApiProperty({
    description: 'Danh mục của thương hiệu',
    example: { id: 1, name: 'Electronics' },
  })
  category: {
    id: number;
    name: string;
  };
}
