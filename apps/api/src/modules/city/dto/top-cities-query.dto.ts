import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class TopCitiesQueryDto {
  @IsOptional()
  @IsIn(['world', 'cn', 'us'])
  rangeType?: 'world' | 'cn' | 'us';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  number?: number;
}

