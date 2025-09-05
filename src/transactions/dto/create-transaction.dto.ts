import {
  IsCreditCard,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @IsCreditCard()
  @IsNotEmpty()
  cardNumber: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsISO8601()
  txnAtUtc: string;

  @IsString()
  @IsNotEmpty()
  stationId: string;
}