import {
  Body,
  Controller,
  HttpCode,
  Post,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SecurityGuard } from '../shared/guards/security.guard';


@Controller('v1/transactions') // Base path for all routes in this controller
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post('webhook/fuel-transactions') // Endpoint: POST /v1/transactions/webhook/fuel-transactions
  @HttpCode(200) // Set the success status code to 200 OK
  @UseGuards(SecurityGuard)
  async handleFuelTransaction(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    // 1. Basic check for the idempotency key header
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-key header is required.');
    }

    // 2. Delegate the entire business logic to the service
    // The service will either return a success object or throw an appropriate HTTP exception
    return this.transactionsService.processTransaction(
      createTransactionDto,
      idempotencyKey,
    );
  }
}