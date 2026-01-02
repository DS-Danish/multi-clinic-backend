import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string; // unique identifier

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Clinic Admin details
  @IsString()
  adminName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsOptional()
  @IsString()
  adminPhone?: string;
}
