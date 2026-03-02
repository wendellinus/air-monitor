import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FavoriteCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cityId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  lat!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  lon!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  adm2!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  adm1!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  country!: string;
}
