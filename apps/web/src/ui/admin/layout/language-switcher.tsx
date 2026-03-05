import React from 'react';
import type { UpdateLocaleRequest } from '@air-monitor/shared';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/shared/api';
import { useI18n } from '@/shared/i18n';
import type { Locale } from '@/shared/i18n';
import { useAdminSessionStore } from '@/ui/admin/stores/admin-session-store';

export const LOCALES: readonly Locale[] = ['zh-CN', 'en-US'];

export function isLocale(value: string): value is Locale {
  return value === 'zh-CN' || value === 'en-US';
}

interface UseLocaleSwitcherReturn {
  locale: Locale;
  saving: boolean;
  changeLocale: (nextLocale: Locale) => Promise<void>;
  getLocaleLabel: (target: Locale) => string;
}

export function useLocaleSwitcher(): UseLocaleSwitcherReturn {
  const { locale, setLocale, t } = useI18n();
  const me = useAdminSessionStore((state) => state.me);
  const setMe = useAdminSessionStore((state) => state.setMe);
  const [saving, setSaving] = React.useState(false);

  const getLocaleLabel = React.useCallback(
    (target: Locale): string => (target === 'zh-CN' ? t('language.zh') : t('language.en')),
    [t],
  );

  const changeLocale = React.useCallback(
    async (nextLocale: Locale): Promise<void> => {
      if (saving || nextLocale === locale) return;

      const previous = locale;
      const previousMe = me;
      setLocale(nextLocale);
      if (previousMe) {
        setMe({ ...previousMe, locale: nextLocale });
      }
      setSaving(true);
      try {
        const payload: UpdateLocaleRequest = { locale: nextLocale };
        await api.post('/user/me/locale', payload);
      } catch (errorValue) {
        setLocale(previous);
        if (previousMe) {
          setMe(previousMe);
        }
      } finally {
        setSaving(false);
      }
    },
    [locale, me, saving, setLocale, setMe],
  );

  return { locale, saving, changeLocale, getLocaleLabel };
}

export function LanguageSwitcher(props: { className?: string }): React.ReactNode {
  const { locale, saving, changeLocale, getLocaleLabel } = useLocaleSwitcher();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border/70 bg-background/90 p-1 shadow-sm',
        props.className,
      )}
    >
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
          disabled={saving}
          onClick={() => void changeLocale(value)}
        >
          {getLocaleLabel(value)}
        </Button>
      ))}
    </div>
  );
}
