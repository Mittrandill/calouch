import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, en, getTranslations, resolveLocale, SUPPORTED_LOCALES, tr } from './index';

describe('resolveLocale', () => {
  it('bölge ekli etiketi taban dile indirger', () => {
    expect(resolveLocale('tr-TR')).toBe('tr');
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('en_GB')).toBe('en');
  });

  it('büyük/küçük harf farkı gözetmez', () => {
    expect(resolveLocale('TR')).toBe('tr');
    expect(resolveLocale('En-us')).toBe('en');
  });

  it('desteklenmeyen dili Türkçeye düşürür', () => {
    expect(resolveLocale('de-DE')).toBe('tr');
    expect(resolveLocale('ar')).toBe('tr');
  });

  it('dil bilinmiyorken varsayılanı verir', () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('')).toBe(DEFAULT_LOCALE);
  });
});

describe('çeviri bütünlüğü', () => {
  const collectKeys = (obj: object, prefix = ''): string[] =>
    Object.entries(obj)
      .flatMap(([key, value]) =>
        typeof value === 'object' && value !== null
          ? collectKeys(value, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
      .sort();

  it('EN, TR ile birebir aynı anahtarları taşır', () => {
    expect(collectKeys(en)).toEqual(collectKeys(tr));
  });

  it.each(SUPPORTED_LOCALES)('%s: hiçbir çeviri boş değil', (locale) => {
    const dict = getTranslations(locale);
    for (const key of collectKeys(dict)) {
      const value = key.split('.').reduce<unknown>((a, p) => (a as Record<string, unknown>)[p], dict);
      expect(typeof value, key).toBe('string');
      expect((value as string).trim().length, key).toBeGreaterThan(0);
    }
  });

  it('EN çevirileri TR metninin kopyası değil', () => {
    // Kopyala-yapıştır ile unutulmuş çeviriyi yakalar. Marka adı hariç.
    expect(en.tabs.today).not.toBe(tr.tabs.today);
    expect(en.auth.signIn).not.toBe(tr.auth.signIn);
    expect(en.authError.network).not.toBe(tr.authError.network);
  });
});
