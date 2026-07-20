import { describe, expect, it } from 'vitest';

import { AA_LARGE_TEXT, AA_TEXT, contrastRatio, hexToRgb } from './contrast';
import { colorSchemes, resolveTheme, type ResolvedTheme } from './index';
import { typography } from './typography';

const themes = Object.keys(colorSchemes) as ResolvedTheme[];

describe('resolveTheme', () => {
  it("'system' tercihini cihaz görünümüne devreder", () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
  });

  it('cihaz görünümü bilinmiyorken light tarafına düşer', () => {
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('system', undefined)).toBe('light');
  });

  it('açık tercihi cihaz görünümü ezemez', () => {
    expect(resolveTheme('oled', 'light')).toBe('oled');
    expect(resolveTheme('light', 'dark')).toBe('light');
  });

  it("'system' seçiliyken OLED'e kendiliğinden geçmez", () => {
    // OLED bir pil/tercih kararıdır; koyu görünüm onu ima etmez.
    expect(resolveTheme('system', 'dark')).not.toBe('oled');
  });
});

describe('tema bütünlüğü', () => {
  it('PRD §02 tema listesini karşılar', () => {
    expect(themes).toEqual(['light', 'dark', 'oled']);
  });

  it.each(themes)('%s teması semantik token yapısını eksiksiz doldurur', (theme) => {
    const scheme = colorSchemes[theme];

    // Eksik anahtar zaten derleme hatası; bu test paletin *değer* tarafını
    // korur — ör. yanlışlıkla undefined atanması.
    const flatten = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'string'
          ? [`${prefix}${key}`]
          : flatten(value as object, `${prefix}${key}.`),
      );

    const keys = flatten(scheme);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const value = key
        .split('.')
        .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], scheme);
      expect(typeof value, `${theme}.${key} string olmalı`).toBe('string');
      expect(() => hexToRgb(value as string), `${theme}.${key} geçerli hex olmalı`).not.toThrow();
    }
  });

  it('tüm temalar aynı anahtar kümesini taşır', () => {
    const shape = (obj: object): string[] =>
      Object.entries(obj)
        .flatMap(([key, value]) =>
          typeof value === 'string' ? [key] : Object.keys(value as object).map((k) => `${key}.${k}`),
        )
        .sort();

    const light = shape(colorSchemes.light);
    for (const theme of themes) {
      expect(shape(colorSchemes[theme]), `${theme} light ile aynı şekli taşımalı`).toEqual(light);
    }
  });
});

/**
 * PRD §02: erişilebilirlik ve yüksek kontrast zorunlu.
 *
 * Bu test paletin kendisini denetler. Marka rengi ileride değişirse, kontrast
 * kaybı kod incelemesinde değil CI'da yakalanır.
 */
describe('WCAG kontrastı', () => {
  it.each(themes)('%s: ana metin arka plan ve yüzey üstünde AA geçer', (theme) => {
    const c = colorSchemes[theme];
    expect(contrastRatio(c.text.primary, c.background.default)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.text.primary, c.surface.default)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.text.primary, c.surface.elevated)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(themes)('%s: ikincil metin yüzey üstünde AA geçer', (theme) => {
    const c = colorSchemes[theme];
    expect(contrastRatio(c.text.secondary, c.surface.default)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(themes)('%s: medya/fotoğraf scrim metni AA geçer', (theme) => {
    const c = colorSchemes[theme];
    expect(contrastRatio(c.text.onMedia, c.background.media)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(themes)('%s: marka dolgusu üstündeki metin AA geçer', (theme) => {
    const c = colorSchemes[theme];
    expect(contrastRatio(c.brand.onBrand, c.brand.default)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(themes)('%s: marka metni arka plan üstünde AA geçer', (theme) => {
    const c = colorSchemes[theme];
    expect(contrastRatio(c.brand.text, c.background.default)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.brand.text, c.surface.default)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(themes)('%s: odak sınırı UI bileşeni eşiğini geçer', (theme) => {
    const c = colorSchemes[theme];
    // Klavye/switch-control kullanıcısı odağı göremezse ekran gezilemez.
    expect(contrastRatio(c.border.focus, c.background.default)).toBeGreaterThanOrEqual(
      AA_LARGE_TEXT,
    );
  });

  it.each(themes)('%s: durum renkleri yüzey üstünde okunur', (theme) => {
    const c = colorSchemes[theme];
    for (const key of ['success', 'warning', 'danger', 'info'] as const) {
      expect(
        contrastRatio(c.status[key], c.surface.default),
        `status.${key}`,
      ).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
    }
  });
});

describe('tipografi', () => {
  it('numeric token\'lar tabular-nums taşır', () => {
    // PRD §02: kalori/kilo/antrenman sayıları tabular. Aksi hâlde sayaç
    // her güncellemede yatay zıplar.
    for (const key of ['numericDisplay', 'numeric', 'numericSm'] as const) {
      expect(typography[key].fontVariant, key).toEqual(['tabular-nums']);
    }
  });

  it('metin token\'ları tabular-nums taşımaz', () => {
    for (const key of ['display', 'heading', 'body', 'label', 'caption'] as const) {
      expect(typography[key], key).not.toHaveProperty('fontVariant');
    }
  });

  it('her token satır yüksekliği font boyutundan büyük', () => {
    for (const [key, style] of Object.entries(typography)) {
      expect(style.lineHeight, key).toBeGreaterThan(style.fontSize);
    }
  });
});
