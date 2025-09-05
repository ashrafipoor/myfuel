import { ApiProperty } from '@nestjs/swagger'; // <-- Import this
import {
  IsCreditCard,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    example: '4111-2222-3333-4444',
    description: 'The 16-digit fuel card number',
  })
  @IsCreditCard()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({
    example: 47.5,
    description: 'The total amount of the fuel purchase',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: '2025-09-05T01:55:00Z',
    description: 'The UTC timestamp of the transaction',
  })
  @IsISO8601()
  txnAtUtc: string;

  @ApiProperty({
    example: 'ST-92810',
    description: 'The unique identifier for the petrol station',
  })
  @IsString()
  @IsNotEmpty()
  stationId: string;
}
