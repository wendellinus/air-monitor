import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  @ValidateIf((value: LoginDto) => value.password !== undefined)
  @MinLength(1)
  password?: string;

  @IsOptional()
  @IsString()
  encryptedPassword?: string;

  @IsOptional()
  @IsString()
  passwordKeyId?: string;
}
