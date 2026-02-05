import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { NoticeLevel } from '../notice.constants';

const LevelValues = [NoticeLevel.Info, NoticeLevel.Urgent] as const;

export class AdminCreateNoticeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @Type(() => Date)
  @IsDate()
  endTime!: Date;

  @IsIn(LevelValues)
  level!: (typeof LevelValues)[number];
}

