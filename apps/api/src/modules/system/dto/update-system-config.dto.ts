import { IsInt, Min } from 'class-validator';

import { MIN_POLLING_INTERVAL_MS } from '../system.constants';

export class UpdateSystemConfigDto {
  @IsInt()
  @Min(MIN_POLLING_INTERVAL_MS)
  pollingInterval!: number;
}
