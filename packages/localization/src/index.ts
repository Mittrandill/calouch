import { en } from './en';
import { tr, type Translations } from './tr';

export { en, tr, type Translations };

/** PRD §00 ilk sürüm kapsamı: "Türkçe/İngilizce". */
export const SUPPORTED_LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Ürünün ana pazarı Türkiye; tanınmayan cihaz dili buraya düşer. */
export const DEFAULT_LOCALE: Locale = 'tr';

export const translations: Record<Locale, Translations> = { tr, en };

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Cihaz dil etiketini desteklenen bir dile indirger.
 * `tr-TR`, `tr_TR` ve `TR` aynı sonucu verir; desteklenmeyen dil varsayılana düşer.
 */
export function resolveLocale(deviceTag: string | null | undefined): Locale {
  if (!deviceTag) return DEFAULT_LOCALE;
  const base = deviceTag.toLowerCase().split(/[-_]/)[0];
  return base !== undefined && isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
