import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsOptional } from 'class-validator';

import type { ProviderRefreshRequest, ProviderType } from '@air-monitor/shared';

const PROVIDER_VALUES: ProviderType[] = ['qweather', 'amap'];

export class ManualRefreshDto implements ProviderRefreshRequest {
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2)
  @IsIn(PROVIDER_VALUES, { each: true })
  providers?: ProviderType[];
}
