/**
 * PRD §02: "Display, heading, body, label, caption ve numeric tipografi."
 */

export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
  /** RN fontVariant; yalnız numeric token'larda dolu. */
  fontVariant?: readonly ['tabular-nums'];
};

/**
 * Kalori, kilo, set/tekrar ve süre bu token'larla yazılır.
 *
 * tabular-nums olmadan orantılı rakamlar farklı genişlik alır; sayaç her
 * güncellendiğinde metin yatay olarak zıplar. PRD §02 bunu açıkça şart koşar:
 * "Kalori, kilo ve antrenman sayıları tabular number kullanır."
 */
const tabular = ['tabular-nums'] as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  headingSm: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },

  /** Bugün ekranındaki büyük kalori sayacı. */
  numericDisplay: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: tabular,
  },
  /** Kart içi metrik: makro gramajı, su, adım. */
  numeric: { fontSize: 20, lineHeight: 26, fontWeight: '600', fontVariant: tabular },
  /** Liste satırı içi küçük metrik. */
  numericSm: { fontSize: 14, lineHeight: 18, fontWeight: '500', fontVariant: tabular },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;
