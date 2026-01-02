import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  clinicId: string;

  @IsString()
  doctorId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  timezone?: string; // Client timezone (e.g., 'Asia/Karachi')
}
