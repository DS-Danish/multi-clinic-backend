import { IsOptional, IsString } from 'class-validator';

export class GetAppointmentsDto {
  @IsOptional()
  @IsString()
  status?: string;
}
