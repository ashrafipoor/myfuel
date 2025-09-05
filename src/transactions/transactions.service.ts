import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Card, CardStatus } from '../cards/entities/card.entity';
import { DataSource, Repository } from 'typeorm';
import {
  RejectionReason,
  Transaction,
  TransactionStatus,
} from './entities/transaction.entity';
import { LimitCounter, PeriodType } from './entities/limit-counter.entity';
import { OrgBalance } from '../organizations/entities/org-balance.entity';
import { BalanceLedger } from '../organizations/entities/balance-ledger.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardsRepository: Repository<Card>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    // ... other repositories are implicitly here from your code
    private readonly dataSource: DataSource,
  ) {}

  async processTransaction(
    createTransactionDto: CreateTransactionDto,
    idempotencyKey: string,
  ) {
    const { format, toZonedTime } = await import('date-fns-tz');
    // Step 0: Idempotency Check
    const existingTransaction = await this.transactionsRepository.findOne({
      where: { idempotencyKey },
    });
    if (existingTransaction) {
      // If a transaction with this key exists, return its saved response.
      return existingTransaction.responseBody;
    }

    const { cardNumber, amount, txnAtUtc } = createTransactionDto;

    // Step 1: Find Card and Organization
    const card = await this.cardsRepository.findOne({
      where: { cardNumber },
      relations: { organization: true },
    });

    if (!card) {
      throw new NotFoundException('Card not found.');
    }
    if (card.status !== CardStatus.ACTIVE) {
      // You can implement saving a rejected transaction here if needed.
      throw new UnprocessableEntityException('Card is not active.');
    }

    // Step 2: Begin Atomic Database Transaction
    // The outer try...catch is removed. dataSource.transaction handles errors.
    return this.dataSource.transaction(async (manager) => {
      // Step 3: Calculate Timezone-aware Period Keys
      const localTime = toZonedTime(new Date(txnAtUtc), card.organization.timezone);
      const dailyKey = format(localTime, 'yyyy-MM-dd');
      const monthlyKey = format(localTime, 'yyyy-MM');

      // Step 4: Fetch and Lock Critical Rows
      const orgBalance = await manager.findOne(OrgBalance, {
        where: { orgId: card.orgId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!orgBalance) {
        // This is a critical data integrity issue.
        throw new InternalServerErrorException('Organization balance data is missing.');
      }

      const dailyCounter = await manager.findOne(LimitCounter, { where: { cardId: card.id, periodType: PeriodType.DAILY, periodKey: dailyKey }, lock: { mode: 'pessimistic_write' } });
      const monthlyCounter = await manager.findOne(LimitCounter, { where: { cardId: card.id, periodType: PeriodType.MONTHLY, periodKey: monthlyKey }, lock: { mode: 'pessimistic_write' } });
      
      // Step 5: Perform Business Rule Validations
      const dailyUsed = dailyCounter?.usedAmount ?? 0;
      const monthlyUsed = monthlyCounter?.usedAmount ?? 0;
      let rejectionReason: RejectionReason | null = null;

      if (orgBalance.balanceAmount < amount) {
        rejectionReason = RejectionReason.INSUFFICIENT_FUNDS;
      } else if (dailyUsed + amount > card.dailyLimit) {
        rejectionReason = RejectionReason.DAILY_LIMIT_EXCEEDED;
      } else if (monthlyUsed + amount > card.monthlyLimit) {
        rejectionReason = RejectionReason.MONTHLY_LIMIT_EXCEEDED;
      }
      
      // Step 6: If Validation Fails, Record and Throw
      if (rejectionReason) {
        const responseBody = {
          status: TransactionStatus.REJECTED,
          reason: rejectionReason,
        };
        const rejectedTx = manager.create(Transaction, {
          ...createTransactionDto,
          orgId: card.orgId,
          cardId: card.id,
          idempotencyKey,
          status: TransactionStatus.REJECTED,
          reasonCode: rejectionReason,
          responseBody,
          responseStatusCode: 422,
        });
        await manager.save(rejectedTx);
        throw new UnprocessableEntityException(responseBody);
      }

      // Step 7: If Validations Pass, Execute Updates
      // 7a: Deduct balance
      orgBalance.balanceAmount = Number(orgBalance.balanceAmount) - amount;
      await manager.save(orgBalance);
      
      // 7b: Create ledger entry
      const ledgerEntry = manager.create(BalanceLedger, { orgId: card.orgId, deltaAmount: -amount, balanceAfter: orgBalance.balanceAmount });
      await manager.save(ledgerEntry);
      
      // 7c: Upsert counters
      await manager.upsert(LimitCounter, { cardId: card.id, orgId: card.orgId, periodType: PeriodType.DAILY, periodKey: dailyKey, usedAmount: dailyUsed + amount }, ['cardId', 'periodType', 'periodKey']);
      await manager.upsert(LimitCounter, { cardId: card.id, orgId: card.orgId, periodType: PeriodType.MONTHLY, periodKey: monthlyKey, usedAmount: monthlyUsed + amount }, ['cardId', 'periodType', 'periodKey']);
      
      // 7d: Record approved transaction and its response for idempotency
      const responseBody = { status: TransactionStatus.APPROVED, transactionId: '', balanceAfter: orgBalance.balanceAmount };
      const approvedTx = manager.create(Transaction, {
        ...createTransactionDto,
        orgId: card.orgId,
        cardId: card.id,
        idempotencyKey,
        status: TransactionStatus.APPROVED,
        responseBody,
        responseStatusCode: 200,
      });
      const savedTransaction = await manager.save(approvedTx);

      // 7e: Finalize links and response
      ledgerEntry.txnId = savedTransaction.id;
      await manager.save(ledgerEntry);
      
      savedTransaction.responseBody.transactionId = savedTransaction.id;
      await manager.save(savedTransaction);
      
      return savedTransaction.responseBody;
    });
  }
}