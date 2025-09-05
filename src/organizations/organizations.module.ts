import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrgBalance } from './entities/org-balance.entity';
import { BalanceLedger } from './entities/balance-ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrgBalance, BalanceLedger])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
