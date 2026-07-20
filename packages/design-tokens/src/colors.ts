import { chartreuse, graphite, macro, neutral, teal } from './primitives';

/**
 * Semantik renk sözleşmesi (PRD §02: background, surface, text, brand,
 * status ve border grupları zorunlu).
 *
 * Her tema aynı anahtarları doldurmak zorundadır; eksik anahtar derleme
 * hatasıdır. Yeni bir tema eklendiğinde hiçbir ekran güncellenmez.
 */
export type ColorScheme = {
  background: {
    /** Ekranın en alt katmanı. */
    default: string;
    /** Kamera/fotoğraf gibi tam ekran medya arkası. */
    media: string;
  };
  surface: {
    /** Kart, sheet, liste satırı. */
    default: string;
    /** Modal, popover — arka plandan bir kademe yukarısı. */
    elevated: string;
    /** Basılı/seçili hâl. */
    pressed: string;
  };
  text: {
    primary: string;
    secondary: string;
    /** Yardımcı metin. Uzun okuma için kullanılmaz. */
    tertiary: string;
    /** Marka veya koyu dolgu üstünde. */
    inverse: string;
    disabled: string;
  };
  brand: {
    /** Dolgu: birincil buton, seçili sekme. Metin rengi olarak KULLANILMAZ. */
    default: string;
    pressed: string;
    /** `default` dolgusunun üstündeki metin/ikon. */
    onBrand: string;
    /** Rozet, seçili sekme arkası gibi düşük vurgu. */
    subtle: string;
    /** Arka plan üstünde marka renkli metin/ikon. */
    text: string;
  };
  status: {
    success: string;
    successSurface: string;
    warning: string;
    warningSurface: string;
    danger: string;
    dangerSurface: string;
    info: string;
    infoSurface: string;
  };
  border: {
    default: string;
    strong: string;
    /** Klavye odağı — erişilebilirlik için her temada görünür olmalı. */
    focus: string;
  };
  macro: {
    protein: string;
    carbs: string;
    fat: string;
  };
};

/**
 * Görsel dil kararı (2026-07-19): koyu tema artık BİRİNCİL deneyim
 * (`ThemeProvider` varsayılanı `dark`) — chartreuse vurgusu neredeyse siyah
 * zeminde en güçlü kontrastı taşıyor (17:1+). Açık tema aynı marka
 * ailesiyle güncellendi ama chartreuse[500] METİN olarak KULLANILMAZ
 * (beyaz zeminde ~1:1 kontrast) — chartreuse[800] AA-güvenli koyu varyant.
 */
export const darkColors: ColorScheme = {
  background: { default: graphite.background, media: neutral[1000] },
  surface: { default: graphite.surface, elevated: graphite.surfaceElevated, pressed: graphite.surfacePressed },
  text: {
    primary: graphite.text,
    secondary: '#A8A8A8',
    tertiary: '#7A7A7A',
    inverse: graphite.background,
    disabled: '#525252',
  },
  brand: {
    default: chartreuse[500],
    pressed: chartreuse[600],
    onBrand: graphite.background,
    subtle: chartreuse[900],
    text: chartreuse[500],
  },
  status: {
    success: '#4ADE80',
    successSurface: '#14532D',
    warning: '#FBBF24',
    warningSurface: '#78350F',
    danger: '#F87171',
    dangerSurface: '#7F1D1D',
    info: teal[400],
    infoSurface: teal[900],
  },
  border: { default: graphite.border, strong: graphite.borderStrong, focus: chartreuse[500] },
  macro,
};

/**
 * OLED: arka plan gerçek siyah olduğu için yüzeyler dark'a göre bir kademe
 * daha koyudur — yoksa kartlar yüzer gibi görünür.
 */
export const oledColors: ColorScheme = {
  ...darkColors,
  background: { default: graphite.backgroundOled, media: graphite.backgroundOled },
  surface: {
    default: graphite.surfaceOled,
    elevated: graphite.surfaceElevatedOled,
    pressed: graphite.surfacePressedOled,
  },
  border: { ...darkColors.border, default: graphite.borderOled },
};

export const lightColors: ColorScheme = {
  background: { default: neutral[50], media: neutral[1000] },
  surface: { default: neutral[0], elevated: neutral[0], pressed: neutral[100] },
  text: {
    primary: neutral[900],
    secondary: neutral[600],
    tertiary: neutral[500],
    inverse: neutral[0],
    disabled: neutral[400],
  },
  brand: {
    default: chartreuse[500],
    pressed: chartreuse[600],
    onBrand: graphite.background,
    subtle: chartreuse[100],
    // chartreuse[500] açık zeminde metin olarak OKUNMAZ (~1:1) — 800 AA geçer (5.17:1).
    text: chartreuse[800],
  },
  status: {
    success: '#16A34A',
    successSurface: '#DCFCE7',
    warning: '#B45309',
    warningSurface: '#FEF3C7',
    danger: '#DC2626',
    dangerSurface: '#FEE2E2',
    info: teal[700],
    infoSurface: teal[50],
  },
  // focus chartreuse[500] değil: açık zeminde ~1:1, non-text 3:1 eşiğinin altında.
  border: { default: neutral[200], strong: neutral[300], focus: chartreuse[800] },
  macro,
};
