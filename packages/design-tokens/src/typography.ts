/**
 * PRD §02: "Display, heading, body, label, caption ve numeric tipografi."
 */

export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
  /**
   * RN fontVariant; yalnız numeric token'larda dolu.
   *
   * Bilinçli olarak MUTABLE tuple: React Native'in `TextStyle.fontVariant`
   * tipi `FontVariant[]`dir (readonly değil). `readonly [...]` yazılsaydı,
   * bu paket RN'e bağımlı olmasa da (§01), token RN `style` prop'una
   * verildiği an "readonly array, mutable array'e atanamaz" derleme
   * hatası üretirdi — tüketilene kadar fark edilmeyen bir hata.
   */
  fontVariant?: ['tabular-nums'];
};

/**
 * Kalori, kilo, set/tekrar ve süre bu token'larla yazılır.
 *
 * tabular-nums olmadan orantılı rakamlar farklı genişlik alır; sayaç her
 * güncellendiğinde metin yatay olarak zıplar. PRD §02 bunu açıkça şart koşar:
 * "Kalori, kilo ve antrenman sayıları tabular number kullanır."
 *
 * `as const` KULLANILMAZ: bu değişken aşağıda `typography` nesnesinin
 * `as const` bloğuna referans olarak giriyor; kendi tipi zaten dar
 * (`['tabular-nums']`), ayrıca const'lamak onu readonly'e çevirir ve
 * yukarıdaki sorunu geri getirir.
 */
const tabular: ['tabular-nums'] = ['tabular-nums'];

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
