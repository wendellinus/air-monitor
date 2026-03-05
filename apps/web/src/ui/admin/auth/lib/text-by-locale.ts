export function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}
