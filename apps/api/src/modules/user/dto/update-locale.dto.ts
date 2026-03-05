import { IsIn } from 'class-validator';

import type { UserLocale } from '@air-monitor/shared';

const USER_LOCALES: UserLocale[] = ['zh-CN', 'en-US'];

export class UpdateLocaleDto {
  @IsIn(USER_LOCALES)
  locale!: UserLocale;
}

