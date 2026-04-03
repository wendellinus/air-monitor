import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  @ValidateIf((value: RegisterDto) => value.password !== undefined)
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  encryptedPassword?: string;

  @IsOptional()
  @IsString()
  passwordKeyId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
