import { Body, Controller, HttpCode, Post, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // <-- Import these
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SecurityGuard } from '../shared/guards/security.guard';

@ApiTags('transactions') // <-- Groups endpoints under a "transactions" tag
@Controller('v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('webhook/fuel-transactions')
  @HttpCode(200)
  @ApiOperation({ summary: 'Process a fuel transaction webhook from a petrol station' })
  @ApiHeader({ name: 'idempotency-key', description: 'A unique key to prevent duplicate processing', required: true })
  @ApiHeader({ name: 'x-signature', description: 'HMAC-SHA256 signature of the request payload', required: true })
  @ApiHeader({ name: 'x-signature-timestamp', description: 'The UTC timestamp when the signature was created', required: true })
  @ApiResponse({ status: 200, description: 'Transaction processed successfully (Approved or Rejected).' })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid signature.' })
  @ApiResponse({ status: 422, description: 'Unprocessable Entity: Transaction rejected due to business rules (e.g., insufficient funds).' })
  @UseGuards(SecurityGuard)
  async handleFuelTransaction(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-key header is required.');
    }
    return this.transactionsService.processTransaction(
      createTransactionDto,
      idempotencyKey,
    );
  }
}