import {
  RejectionReason,
  TransactionStatus,
} from '../entities/transaction.entity';

export interface ApprovedTransactionResponse {
  status: TransactionStatus.APPROVED;
  transactionId: string;
  balanceAfter: number;
}

export interface RejectedTransactionResponse {
  status: TransactionStatus.REJECTED;
  reason: RejectionReason;
}

export type TransactionResponse =
  | ApprovedTransactionResponse
  | RejectedTransactionResponse;
