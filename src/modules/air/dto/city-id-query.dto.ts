import { IsString, MinLength } from 'class-validator';

export class CityIdQueryDto {
  // Keep legacy query param name: city_id
  @IsString()
  @MinLength(1)
  city_id!: string;
}

