import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import type { DashboardLayoutItem, UpdateDashboardLayoutRequest } from '@air-monitor/shared';
import { DashboardWidgetIds } from '@air-monitor/shared';

class DashboardLayoutItemDto implements DashboardLayoutItem {
  @IsIn(DashboardWidgetIds)
  id!: DashboardLayoutItem['id'];

  @IsInt()
  @Min(0)
  order!: number;

  @IsBoolean()
  pinned!: boolean;

  @IsInt()
  @Min(1)
  @Max(3)
  colSpan!: number;

  @IsInt()
  @Min(1)
  @Max(3)
  rowSpan!: number;
}

export class UpdateDashboardLayoutDto implements UpdateDashboardLayoutRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique((item: DashboardLayoutItemDto) => item.id)
  @ValidateNested({ each: true })
  @Type(() => DashboardLayoutItemDto)
  layout!: DashboardLayoutItem[];
}
