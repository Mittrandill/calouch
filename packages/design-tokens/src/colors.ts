import { lime, macro, neutral, status } from './primitives';

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
    /**
     * Arka plan üstünde marka renkli metin/ikon.
     * `default`tan ayrı bir token: canlı lime dolgu olarak mükemmel, metin
     * olarak arka planda AA'yı geçmiyor (1.90). Bu ayrım kasıtlı.
     */
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

export const lightColors: ColorScheme = {
  background: { default: neutral[50], media: neutral[900] },
  surface: { default: neutral[0], elevated: neutral[0], pressed: neutral[100] },
  text: {
    primary: neutral[900],
    secondary: neutral[600],
    tertiary: neutral[500],
    inverse: neutral[0],
    disabled: neutral[400],
  },
  // Canlı lime + neredeyse siyah metin = 9.04:1. Beyaz metin burada 3.09'da
  // kalıyordu, yani AA'yı geçmiyordu — dolgu üstü metin bilinçli olarak koyu.
  brand: {
    default: lime[500],
    pressed: lime[600],
    onBrand: neutral[900],
    subtle: lime[100],
    text: lime[700],
  },
  status: {
    success: status.success,
    successSurface: status.successSoft,
    warning: status.warning,
    warningSurface: status.warningSoft,
    danger: status.danger,
    dangerSurface: status.dangerSoft,
    info: status.info,
    infoSurface: status.infoSoft,
  },
  // focus lime[600] değil: açık zeminde 2.97 ile non-text 3:1 eşiğinin altında.
  border: { default: neutral[200], strong: neutral[300], focus: lime[700] },
  macro,
};

export const darkColors: ColorScheme = {
  background: { default: neutral[950], media: neutral[1000] },
  surface: { default: neutral[900], elevated: neutral[800], pressed: neutral[800] },
  text: {
    primary: neutral[50],
    secondary: neutral[300],
    tertiary: neutral[400],
    inverse: neutral[900],
    disabled: neutral[600],
  },
  // Koyu zeminde parlak uç hem dolgu hem metin olarak çalışır (13.38).
  brand: {
    default: lime[400],
    pressed: lime[300],
    onBrand: neutral[900],
    subtle: lime[900],
    text: lime[400],
  },
  status: {
    success: '#4ADE80',
    successSurface: '#14532D',
    warning: '#FBBF24',
    warningSurface: '#78350F',
    danger: '#F87171',
    dangerSurface: '#7F1D1D',
    info: '#38BDF8',
    infoSurface: '#0C4A6E',
  },
  border: { default: neutral[800], strong: neutral[700], focus: lime[400] },
  macro: { protein: '#818CF8', carbs: '#FBBF24', fat: '#F472B6' },
};

/**
 * OLED: arka plan gerçek siyah olduğu için yüzeyler dark'a göre bir kademe
 * daha koyudur — yoksa kartlar yüzer gibi görünür.
 */
export const oledColors: ColorScheme = {
  ...darkColors,
  background: { default: neutral[1000], media: neutral[1000] },
  surface: { default: neutral[950], elevated: neutral[900], pressed: neutral[900] },
  border: { ...darkColors.border, default: neutral[900] },
};
