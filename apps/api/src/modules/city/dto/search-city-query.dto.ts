import { IsString, MinLength } from 'class-validator';

export class SearchCityQueryDto {
  @IsString()
  @MinLength(1)
  keyword!: string;
}

