import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { NoticeLevel } from '../notice.constants';

const LevelValues = [NoticeLevel.Info, NoticeLevel.Urgent] as const;

export class AdminUpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsIn(LevelValues)
  level?: (typeof LevelValues)[number];
}

