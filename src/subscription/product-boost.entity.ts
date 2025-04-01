import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { UserSubscription } from './user-subscription.entity';
import { User } from '../auth/user.entity';

@Entity('product_boosts')
export class ProductBoost {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSubscription, { nullable: true })
  @JoinColumn({ name: 'user_subscription_id' })
  userSubscription: UserSubscription;

  @Column()
  boost_date: Date;

  @Column()
  expiry_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
