import { Card } from '../../cards/entities/card.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // TODO: Add relationships to other entities like Card, OrgBalance, etc. later
  @OneToMany(() => Card, (card) => card.organization)
  cards: Card[];
}
