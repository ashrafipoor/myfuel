import { Card } from '../../cards/entities/card.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TransactionStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RejectionReason {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  MONTHLY_LIMIT_EXCEEDED = 'MONTHLY_LIMIT_EXCEEDED',
  CARD_INACTIVE = 'CARD_INACTIVE',
}

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column()
  stationId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: any;

  @Column({ type: 'int', nullable: true })
  responseStatusCode: number;
  @Column({ type: 'timestamptz' })
  txnAtUtc: Date;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: RejectionReason, nullable: true })
  reasonCode: RejectionReason;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
