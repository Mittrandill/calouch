/**
 * Ham palet. Bu dosyanın DIŞINDA hiçbir yerde ham hex bulunmaz —
 * ESLint bunu zorlar (PRD §02).
 *
 * Buradaki değerler doğrudan kullanılmaz; `colors.ts` içindeki semantik
 * token'lar üzerinden tüketilir. "brand.500" bir karardır, "yeşil" değil.
 *
 * Görsel dil kararı (2026-07-19, kullanıcıyla): marka rengi "Electric
 * Chartreuse" `#D8FF00`'a taşındı — logodaki halka/gauge motifi ve ikincil
 * turkuaz vurgu (`teal`, logodaki göz rengi) buradan geliyor. Koyu tema artık
 * BİRİNCİL deneyim (varsayılan), açık tema aynı marka ailesiyle güncellendi.
 */

/** Marka: tek vurgu rengi. Koyu zeminde metin olarak da kullanılır (17:1+ kontrast). */
export const chartreuse = {
  50: '#FCFFE5',
  100: '#F6FFC2',
  200: '#ECFF85',
  300: '#E4FF52',
  400: '#DCFF26',
  500: '#D8FF00',
  600: '#B8D900',
  700: '#8AA300',
  /** Açık zeminde metin-güvenli (WCAG AA ≥4.5:1) — 500 doğrudan METİN olarak KULLANILMAZ. */
  800: '#5F7000',
  900: '#3A4400',
} as const;

/** İkincil vurgu — logodaki göz rengi. Bilgi durumu ve seçili/aktif ikincil işaretler. */
export const teal = {
  50: '#EEFBF9',
  100: '#D1F5EF',
  200: '#A3EBE0',
  300: '#6EDBCC',
  400: '#3FC9B7',
  500: '#2DD4BF',
  600: '#14B8A6',
  /** Açık zeminde metin-güvenli (WCAG AA ≥4.5:1). */
  700: '#0F766E',
  800: '#115E56',
  900: '#0B3D38',
} as const;

export const neutral = {
  0: '#FFFFFF',
  50: '#F7F7F6',
  100: '#EFF0ED',
  200: '#E1E2DD',
  300: '#C6C7C0',
  400: '#9A9B94',
  500: '#767770',
  600: '#4B4C47',
  700: '#2E2F2B',
  800: '#1A1A19',
  900: '#101410',
  950: '#0A0A0A',
  1000: '#000000',
} as const;

/**
 * Koyu/OLED tema yüzey hiyerarşisi — Rift referansının "neredeyse siyah"
 * zemin dili. `neutral`'ın numaralı ölçeğine sığdırmak yerine ayrı: bu
 * değerler bir marka tonu değil, tek bir amaca (koyu zeminde derinlik)
 * hizmet eden sabit bir küme — `status`/`macro` ile aynı desen.
 */
export const graphite = {
  /** Rift referansının "Clean White"i — koyu zeminde birincil metin. */
  text: '#FBFBFB',
  background: '#0A0A0A',
  backgroundOled: '#000000',
  surface: '#161616',
  surfaceOled: '#0D0D0D',
  surfaceElevated: '#202020',
  surfaceElevatedOled: '#191919',
  surfacePressed: '#262626',
  surfacePressedOled: '#1F1F1F',
  border: '#262626',
  borderOled: '#1F1F1F',
  borderStrong: '#333333',
} as const;

export const status = {
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0F766E',
  infoSoft: '#D1F5EF',
} as const;

/**
 * Makro renkleri. PRD §02: "Makrolar yalnızca renkle ayrılmaz; metin veya
 * ikon taşır." Bu renkler etiketin yerine değil, yanında kullanılır.
 */
export const macro = {
  protein: '#6366F1',
  carbs: '#F59E0B',
  fat: '#EC4899',
} as const;
