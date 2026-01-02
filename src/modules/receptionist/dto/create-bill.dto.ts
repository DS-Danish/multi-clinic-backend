import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateBillDto {
  @IsString()
  appointmentId: string;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  patientId?: string;
}
