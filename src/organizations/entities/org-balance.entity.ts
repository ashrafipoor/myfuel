import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'org_balances' })
export class OrgBalance {
    
    @PrimaryColumn('uuid')
    orgId: string;

    @OneToOne(() => Organization)
    @JoinColumn({ name: 'orgId' })
    organization: Organization;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0.0 })
    balanceAmount: number;

    @UpdateDateColumn({ type: 'timestamptz' })
    asOf: Date;
}