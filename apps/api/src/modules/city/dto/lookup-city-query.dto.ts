import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class LookupCityQueryDto {
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 })
  @Min(-180)
  @Max(180)
  lon!: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 })
  @Min(-90)
  @Max(90)
  lat!: number;
}

