import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from './transactions/transactions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { CardsModule } from './cards/cards.module';
import { Card } from './cards/entities/card.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Organization } from './organizations/entities/organization.entity';
import { BalanceLedger } from './organizations/entities/balance-ledger.entity';
import { OrgBalance } from './organizations/entities/org-balance.entity';
import { LimitCounter } from './transactions/entities/limit-counter.entity';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        entities: [Card,Transaction,Organization,BalanceLedger,OrgBalance,LimitCounter],
        synchronize: true, 

      }),
    }),
    TransactionsModule,
    OrganizationsModule,
    CardsModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
