import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Brand } from '../brand/brand.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  parent_id: number; // NULL nếu là danh mục chính

  @OneToMany(() => Brand, (brand) => brand.category)
  brands: Brand[];
}
