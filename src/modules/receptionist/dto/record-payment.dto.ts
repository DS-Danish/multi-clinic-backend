import { IsString, IsNumber } from 'class-validator';

export class RecordPaymentDto {
  @IsString()
  billId: string;

  @IsNumber()
  amount: number;

  @IsString()
  method: string;
}
