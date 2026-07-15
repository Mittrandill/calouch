/**
 * Ham palet. Bu dosyanın DIŞINDA hiçbir yerde ham hex bulunmaz —
 * ESLint bunu zorlar (PRD §02).
 *
 * Buradaki değerler doğrudan kullanılmaz; `colors.ts` içindeki semantik
 * token'lar üzerinden tüketilir. "brand.500" bir karardır, "yeşil" değil.
 */

/** Marka: Calorie + Coach. Turunçgil yeşili — yemek fotoğrafının üstünde okunur. */
export const lime = {
  50: '#F7FEE7',
  100: '#ECFCCB',
  200: '#D9F99D',
  300: '#BEF264',
  400: '#A3E635',
  500: '#84CC16',
  600: '#65A30D',
  700: '#4D7C0F',
  800: '#3F6212',
  900: '#365314',
} as const;

export const neutral = {
  0: '#FFFFFF',
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
  1000: '#000000',
} as const;

export const status = {
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0284C7',
  infoSoft: '#E0F2FE',
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
