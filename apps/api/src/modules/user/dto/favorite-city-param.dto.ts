import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FavoriteCityParamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cityId!: string;
}
