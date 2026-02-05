import { IsString, MinLength } from 'class-validator';

export class CityIdQueryDto {
  @IsString()
  @MinLength(1)
  city_id!: string;
}

