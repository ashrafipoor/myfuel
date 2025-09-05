import { Transaction } from '../../transactions/entities/transaction.entity';
import { Organization } from './organization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'balance_ledger' })
export class BalanceLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @Column('uuid', { nullable: true })
  txnId: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'txnId' })
  transaction: Transaction;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    comment: 'The change in balance (+ for credit, - for debit)',
  })
  deltaAmount: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    comment: 'The balance of the organization after the change',
  })
  balanceAfter: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}