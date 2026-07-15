/** PRD §02: "4 tabanlı spacing ölçeği." */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** PRD §02: "Small/medium/large/full radius." */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 20,
  /** Hap/avatar. Yükseklikten büyük her değer aynı sonucu verir. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/**
 * PRD §02: "Minimum dokunma alanı 44x44."
 * Basılabilir her bileşen hit-slop dahil bunu karşılamak zorundadır.
 */
export const minTouchTarget = 44;
