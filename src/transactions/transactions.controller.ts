import {
  Body,
  Controller,
  HttpCode,
  Post,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SecurityGuard } from '../shared/guards/security.guard';
import { TransactionResponse } from './dto/transaction-response.dto';

@ApiTags('transactions')
@Controller('v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('webhook/fuel-transactions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Process a fuel transaction webhook from a petrol station',
  })
  @ApiHeader({ name: 'idempotency-key', required: true })
  @ApiHeader({ name: 'x-signature', required: true })
  @ApiHeader({ name: 'x-signature-timestamp', required: true })
  @ApiResponse({
    status: 200,
    description: 'Transaction processed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid signature.' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity: Business rule violation.',
  })
  @UseGuards(SecurityGuard)
  async handleFuelTransaction(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-key header is required.');
    }
    return this.transactionsService.processTransaction(
      createTransactionDto,
      idempotencyKey,
    );
  }
}
