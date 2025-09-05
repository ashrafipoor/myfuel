import { Card } from '../../cards/entities/card.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum PeriodType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
}

@Entity({ name: 'limit_counters' })
@Unique(['cardId', 'periodType', 'periodKey'])
export class LimitCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PeriodType,
  })
  periodType: PeriodType;

  @Column({ length: 10, comment: 'e.g., 2025-09-04 or 2025-09' })
  periodKey: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0.0 })
  usedAmount: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // --- Relationships ---

  @Column('uuid')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @Column('uuid')
  cardId: string;

  @ManyToOne(() => Card)
  @JoinColumn({ name: 'cardId' })
  card: Card;
}
