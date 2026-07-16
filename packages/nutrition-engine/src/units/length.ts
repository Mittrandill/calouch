/**
 * Boy dönüşümleri.
 *
 * Depolama HER ZAMAN santimetredir (§09 veritabanı `height_cm`). Emperyal
 * yalnız görüntüleme/girdi biçimidir — `unit_system` tercihi bu dönüşümü
 * ne zaman uygulayacağını belirler, iki ayrı depolama sütunu değil.
 */

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  // Yuvarlama 12 inç'e taşarsa (ör. 5'11.6" -> 6'0"), taşma düzeltilir.
  const roundedInches = Math.round(totalInches - feet * INCHES_PER_FOOT);

  if (roundedInches === INCHES_PER_FOOT) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches: roundedInches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return Math.round(totalInches * CM_PER_INCH * 10) / 10;
}
