import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository,ObjectLiteral } from 'typeorm';
import { Card } from '../cards/entities/card.entity';
import { Transaction } from './entities/transaction.entity';
import { LimitCounter } from './entities/limit-counter.entity';
import { OrgBalance } from '../organizations/entities/org-balance.entity';
import { BalanceLedger } from '../organizations/entities/balance-ledger.entity';
import { UnprocessableEntityException } from '@nestjs/common';

// A factory to create mock repositories
type MockRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  upsert: jest.Mock;
};
// The factory function now returns this specific type
const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  upsert: jest.fn(),
});

describe('TransactionsService', () => {
let service: TransactionsService;
  let mockDataSource: { transaction: jest.Mock };

  // Update the types of the mock repository variables
  let mockCardsRepository: MockRepository;
  let mockTransactionsRepository: MockRepository;
  let mockLimitCountersRepository: MockRepository;
  let mockOrgBalancesRepository: MockRepository;
  let mockBalanceLedgerRepository: MockRepository;

  beforeEach(async () => {
    mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        // Provide mock implementations for all dependencies
        { provide: getRepositoryToken(Card), useValue: createMockRepository() },
        { provide: getRepositoryToken(Transaction), useValue: createMockRepository() },
        { provide: getRepositoryToken(LimitCounter), useValue: createMockRepository() },
        { provide: getRepositoryToken(OrgBalance), useValue: createMockRepository() },
        { provide: getRepositoryToken(BalanceLedger), useValue: createMockRepository() },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    // Get instances of our mocks to control them in tests
    mockCardsRepository = module.get(getRepositoryToken(Card));
    mockTransactionsRepository = module.get(getRepositoryToken(Transaction));
    mockLimitCountersRepository = module.get(getRepositoryToken(LimitCounter));
    mockOrgBalancesRepository = module.get(getRepositoryToken(OrgBalance));
    mockBalanceLedgerRepository = module.get(getRepositoryToken(BalanceLedger));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add this inside the describe block

describe('processTransaction', () => {
  it('should process a valid transaction successfully', async () => {
    // Arrange: Setup the mocks to simulate a happy path
    const mockCard = {
      id: 'card-uuid',
      orgId: 'org-uuid',
      dailyLimit: 1000,
      monthlyLimit: 5000,
      status: 'ACTIVE',
      organization: { timezone: 'UTC' },
    };
    const mockBalance = { orgId: 'org-uuid', balanceAmount: 2000 };
    const transactionDto = {
      cardNumber: '1234-5678-9012-3456',
      amount: 100,
      txnAtUtc: new Date().toISOString(),
      stationId: 'station-1',
    };

    // --- Mock Responses ---
    mockTransactionsRepository.findOne.mockResolvedValue(null); // No existing transaction
    mockCardsRepository.findOne.mockResolvedValue(mockCard);
    
    // Mock the transaction block to immediately execute the callback
    mockDataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
            findOne: jest.fn()
                .mockResolvedValueOnce(mockBalance) // for OrgBalance
                .mockResolvedValue(null), // for LimitCounters
            create: jest.fn((_, obj) => obj),
            save: jest.fn(obj => Promise.resolve({...obj, id: 'new-uuid'})),
            upsert: jest.fn().mockResolvedValue(undefined),
        };
        return callback(manager);
    });

    // Act: Call the method we are testing
    const result = await service.processTransaction(transactionDto, 'idempotency-key');

    // Assert: Check if the outcome is correct
    expect(result.status).toEqual('APPROVED');
    expect(result.balanceAfter).toEqual(1900); // 2000 - 100
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });
// Add this 'it' block inside the 'processTransaction' describe block

it('should reject a transaction if the organization balance is insufficient', async () => {
  // Arrange: Setup mocks for an insufficient funds scenario
  const mockCard = {
    id: 'card-uuid-insufficient',
    orgId: 'org-uuid-insufficient',
    dailyLimit: 1000,
    monthlyLimit: 5000,
    status: 'ACTIVE',
    organization: { timezone: 'UTC' },
  };
  // Key part of this test: balance (50) is less than amount (100)
  const mockBalance = { orgId: 'org-uuid-insufficient', balanceAmount: 50 };
  const transactionDto = {
    cardNumber: '1111-2222-3333-4444',
    amount: 100, // Amount is greater than balance
    txnAtUtc: new Date().toISOString(),
    stationId: 'station-2',
  };

  // --- Mock Responses ---
  mockTransactionsRepository.findOne.mockResolvedValue(null); // It's a new transaction
  mockCardsRepository.findOne.mockResolvedValue(mockCard);
  
  // Mock the transaction block to simulate the database interaction
  mockDataSource.transaction.mockImplementation(async (callback) => {
    const manager = {
        findOne: jest.fn()
            .mockResolvedValueOnce(mockBalance) // Return the insufficient balance
            .mockResolvedValue(null), // Return null for limit counters
        create: jest.fn((_, obj) => obj),
        save: jest.fn(obj => Promise.resolve(obj)), // Just return the object being saved
    };
    // The callback is expected to throw an error, which we'll catch in our assertion
    return callback(manager);
  });

  // Act & Assert: Check that the correct exception is thrown
  await expect(
    service.processTransaction(transactionDto, 'idempotency-key-insufficient')
  ).rejects.toThrow(UnprocessableEntityException);

  // Optional: Also assert that a rejected transaction was saved with the correct reason
  // To do this, we'd need to inspect the arguments passed to manager.save inside the mock implementation.
});
// Add this 'it' block inside the 'processTransaction' describe block

it('should reject a transaction if it exceeds the daily limit', async () => {
  // Arrange: Setup mocks for a daily limit exceeded scenario
  const mockCard = {
    id: 'card-uuid-daily-limit',
    orgId: 'org-uuid-daily-limit',
    dailyLimit: 100, // Card has a daily limit of 100
    monthlyLimit: 5000,
    status: 'ACTIVE',
    organization: { timezone: 'UTC' },
  };
  const mockBalance = { orgId: 'org-uuid-daily-limit', balanceAmount: 1000 }; // Plenty of balance
  const mockDailyCounter = {
    cardId: mockCard.id,
    periodType: 'DAILY',
    periodKey: expect.any(String), // We don't care about the exact key in this test
    usedAmount: 60, // 60 has already been spent today
  };
  const transactionDto = {
    cardNumber: '2222-3333-4444-5555',
    amount: 50, // This transaction of 50 will push the total to 110 (60 + 50), which is > 100
    txnAtUtc: new Date().toISOString(),
    stationId: 'station-3',
  };

  // --- Mock Responses ---
  mockTransactionsRepository.findOne.mockResolvedValue(null);
  mockCardsRepository.findOne.mockResolvedValue(mockCard);

  mockDataSource.transaction.mockImplementation(async (callback) => {
    const manager = {
        findOne: jest.fn()
            .mockResolvedValueOnce(mockBalance) // Return sufficient balance
            .mockResolvedValueOnce(mockDailyCounter) // Return the existing daily counter
            .mockResolvedValue(null), // Return null for the monthly counter
        create: jest.fn((_, obj) => obj),
        save: jest.fn(obj => Promise.resolve(obj)),
    };
    return callback(manager);
  });

  // Act & Assert
  await expect(
    service.processTransaction(transactionDto, 'idempotency-key-daily-limit')
  ).rejects.toThrow(UnprocessableEntityException);
  
  // You could also add another assertion to check if the rejected transaction was saved
  // with the correct reason code (DAILY_LIMIT_EXCEEDED).
});

// Add this 'it' block inside the 'processTransaction' describe block

it('should return the saved response for an idempotent request', async () => {
  // Arrange: Setup mocks to simulate an already-processed transaction
  const idempotencyKey = 'a-key-that-was-already-processed';
  const mockExistingTransaction = {
    id: 'tx-12345',
    idempotencyKey: idempotencyKey,
    status: 'APPROVED',
    responseBody: {
      status: 'APPROVED',
      transactionId: 'tx-12345',
      balanceAfter: 950,
    },
    // ... other properties of a Transaction entity
  };

  const transactionDto = {
    cardNumber: '4444-5555-6666-7777',
    amount: 50,
    txnAtUtc: new Date().toISOString(),
    stationId: 'station-4',
  };

  // --- Mock Responses ---
  // Key part of this test: findOne on transactionsRepository returns an existing transaction.
  mockTransactionsRepository.findOne.mockResolvedValue(mockExistingTransaction);

  // Act: Call the method with the duplicate key
  const result = await service.processTransaction(transactionDto, idempotencyKey);

  // Assert: Check that the outcome is correct
  // 1. The result should be the EXACT response body from the original transaction.
  expect(result).toEqual(mockExistingTransaction.responseBody);

  // 2. The database transaction block should NOT have been called.
  expect(mockDataSource.transaction).not.toHaveBeenCalled();

  // 3. No attempt should be made to find the card again.
  expect(mockCardsRepository.findOne).not.toHaveBeenCalled();
});

});
});