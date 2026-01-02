import { IsEmail, IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class AddDoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialityIds?: string[];
}
