export { darkColors, lightColors, oledColors, type ColorScheme } from './colors';
export { AA_LARGE_TEXT, AA_TEXT, contrastRatio, hexToRgb, relativeLuminance } from './contrast';
export { minTouchTarget, radius, spacing, type RadiusToken, type SpacingToken } from './spacing';
export { shadows, type Shadow, type ShadowToken } from './shadows';
export { typography, type TextStyleToken, type TypographyToken } from './typography';

import { darkColors, lightColors, oledColors, type ColorScheme } from './colors';

/**
 * PRD §02: "Tema: system, light, dark ve OLED black."
 *
 * `system` bir palet değil, cihaz tercihine devretme kararıdır; çözümlendikten
 * sonra geriye `light | dark | oled` kalır.
 */
export type ThemePreference = 'system' | 'light' | 'dark' | 'oled';
export type ResolvedTheme = 'light' | 'dark' | 'oled';

export const colorSchemes: Record<ResolvedTheme, ColorScheme> = {
  light: lightColors,
  dark: darkColors,
  oled: oledColors,
};

/**
 * Kullanıcı tercihini cihaz görünümüyle birleştirir.
 * `system` seçiliyken OLED'e otomatik geçilmez — OLED açık bir tercihtir.
 *
 * `systemScheme` bilinçli olarak geniş tiplenir: bu paket RN'den bağımsızdır
 * (§01) ve platform 'unspecified' gibi değerler de bildirebilir. 'dark'
 * dışındaki her şey light kabul edilir.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ResolvedTheme {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}
