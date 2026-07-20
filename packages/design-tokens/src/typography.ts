/**
 * PRD §02: "Display, heading, body, label, caption ve numeric tipografi."
 *
 * Görsel dil kararı (2026-07-19): Space Grotesk — büyük başlıklar ve
 * sayaçlarda, BİLİNÇLİ OLARAK KISITLI (yalnız display/heading/numeric*) —
 * "karakterli bir yüz, tutumlu kullanılır". Gövde metni Inter — nötr,
 * okunaklı, veri yoğun ekranlarda yorulmaz. İkisi de `apps/mobile/app/
 * _layout.tsx`'te `useFonts` ile yüklenir; adlar `@expo-google-fonts/*`
 * paketlerinin export ettiği isimlerle BİREBİR eşleşmeli.
 */
export type FontFamily =
  | 'SpaceGrotesk_700Bold'
  | 'SpaceGrotesk_600SemiBold'
  | 'Inter_400Regular'
  | 'Inter_500Medium'
  | 'Inter_600SemiBold';

export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  fontFamily: FontFamily;
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
  display: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: -0.2,
  },
  headingSm: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', fontFamily: 'Inter_400Regular' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400', fontFamily: 'Inter_400Regular' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', fontFamily: 'Inter_400Regular' },

  /** Bugün ekranındaki büyük kalori sayacı — Space Grotesk'in tek başına en görünür olduğu yer. */
  numericDisplay: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.5,
    fontVariant: tabular,
  },
  /** Kart içi metrik: makro gramajı, su, adım. */
  numeric: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontVariant: tabular,
  },
  /** Liste satırı içi küçük metrik. */
  numericSm: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    fontVariant: tabular,
  },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;
