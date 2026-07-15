/**
 * WCAG 2.1 kontrast oranı.
 *
 * PRD §02 "yüksek kontrast" ve "erişilebilirlik" şartını denetlenebilir hâle
 * getirir. Testte kullanılır; ürün kodunda çalışma zamanında çağrılması
 * beklenmez.
 */

function channelLuminance(value8bit: number): number {
  const c = value8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** `#RGB`, `#RRGGBB` ve `#RRGGBBAA` kabul eder; alfa yok sayılır. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3 || raw.length === 4
      ? raw
          .slice(0, 3)
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw.slice(0, 6);

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Geçersiz hex rengi: ${hex}`);
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

/** 1 (aynı renk) ile 21 (siyah/beyaz) arasında bir oran döner. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Normal boyutlu metin için WCAG AA eşiği. */
export const AA_TEXT = 4.5;
/** Büyük metin (>=18pt bold / >=24pt) ve UI bileşeni/sınır eşiği. */
export const AA_LARGE_TEXT = 3;
