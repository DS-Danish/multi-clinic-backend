import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  timezone?: string; // Client timezone (e.g., 'Asia/Karachi')
}
