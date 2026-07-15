/**
 * PRD §02: "Small/medium/large shadow."
 *
 * iOS gölgeyi shadow* ile, Android elevation ile çizer. Token ikisini birlikte
 * taşır ki çağrı yerinde platform ayrımı yapılmasın (§02: "iOS ve Android aynı
 * marka dilini paylaşır").
 *
 * Koyu temada gölge neredeyse görünmez; derinlik orada `surface.elevated` ile
 * anlatılır. Bu yüzden gölge tek başına hiyerarşi taşımaz.
 */
export type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const shadowColor = '#0F172A';

export const shadows = {
  none: {
    shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
} as const satisfies Record<string, Shadow>;

export type ShadowToken = keyof typeof shadows;
