import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AddReceptionistDto {
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
  phone?: string;
}
