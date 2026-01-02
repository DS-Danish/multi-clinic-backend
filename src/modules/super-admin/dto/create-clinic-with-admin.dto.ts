import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateClinicWithAdminDto {
  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @IsString()
  @IsNotEmpty()
  clinicCode: string;

  @IsEmail()
  clinicEmail: string;

  @IsString()
  @IsNotEmpty()
  clinicPhone: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminPassword: string;
}
