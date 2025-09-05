import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrgBalance } from './entities/org-balance.entity';
import { BalanceLedger } from './entities/balance-ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrgBalance, BalanceLedger])],
  controllers: [],
  providers: [OrganizationsService],
  exports: [TypeOrmModule],
})
export class OrganizationsModule {}
