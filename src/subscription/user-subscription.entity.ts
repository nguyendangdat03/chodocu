import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { SubscriptionPackage } from './subscription-package.entity';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => SubscriptionPackage)
  @JoinColumn({ name: 'package_id' })
  package: SubscriptionPackage;

  @Column()
  start_date: Date;

  @Column()
  expiry_date: Date;

  @Column({ default: 0 })
  remaining_boosts: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  total_boosts_used: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
