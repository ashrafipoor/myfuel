import { Organization } from '../../organizations/entities/organization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cardNumber: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    comment: 'Max spend allowed per day',
  })
  dailyLimit: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    comment: 'Max spend allowed per month',
  })
  monthlyLimit: number;

  @Column({
    type: 'enum',
    enum: CardStatus,
    default: CardStatus.ACTIVE,
  })
  status: CardStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // --- Relationships ---

  @Column('uuid')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;
}