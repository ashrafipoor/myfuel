import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LimitCounter } from './entities/limit-counter.entity';
import { Transaction } from './entities/transaction.entity';
import { CardsModule } from 'src/cards/cards.module';
import { OrganizationsModule } from 'src/organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LimitCounter, Transaction]),
    CardsModule,
    OrganizationsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule { }
