import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  clinicId: string;

  @IsString()
  doctorId: string;

  @IsString()
  patientId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
