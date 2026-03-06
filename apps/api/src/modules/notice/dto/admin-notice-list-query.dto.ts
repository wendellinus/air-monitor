import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { NoticeStatus } from '../notice.constants';

const StatusValues = [NoticeStatus.Draft, NoticeStatus.Published, NoticeStatus.Revoked] as const;

export class AdminNoticeListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsIn(StatusValues)
  status?: (typeof StatusValues)[number];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;
}
