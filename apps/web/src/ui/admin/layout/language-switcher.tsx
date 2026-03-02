import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/shared/i18n';
import type { Locale } from '@/shared/i18n';

const LOCALES: Locale[] = ['zh-CN', 'en-US'];

export function LanguageSwitcher(): React.ReactNode {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-lg border border-border/70 bg-background/90 p-1 shadow-sm">
      {LOCALES.map((value) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 rounded-md px-2.5 text-xs',
            locale === value && 'bg-muted text-foreground shadow-sm',
          )}
          onClick={() => setLocale(value)}
        >
          {value === 'zh-CN' ? t('language.zh') : t('language.en')}
        </Button>
      ))}
    </div>
  );
}
