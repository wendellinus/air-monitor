import React from 'react';

import { DEFAULT_LOCALE, I18N_STORAGE_KEY, MESSAGES, type Locale, type MessageKey } from './messages';

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: TranslationParams) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

function normalizeLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const value = input.toLowerCase();
  if (value === 'zh-cn' || value === 'zh') return 'zh-CN';
  if (value === 'en-us' || value === 'en') return 'en-US';
  return DEFAULT_LOCALE;
}

function resolveInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const fromStorage = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (fromStorage) return normalizeLocale(fromStorage);

  return normalizeLocale(window.navigator.language);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function I18nProvider(props: { children: React.ReactNode }): React.ReactNode {
  const [locale, setLocale] = React.useState<Locale>(() => resolveInitialLocale());

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(I18N_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = React.useCallback(
    (key: MessageKey, params?: TranslationParams): string => {
      const currentMessages = MESSAGES[locale];
      const fallback = MESSAGES[DEFAULT_LOCALE];
      const raw = currentMessages[key] ?? fallback[key] ?? key;
      return interpolate(raw, params);
    },
    [locale],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider.');
  }
  return context;
}
