/**
 * Kilo dönüşümleri. Depolama her zaman kilogramdır (§09 `weight_kg`).
 */

const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return Math.round((kg / KG_PER_LB) * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round(lb * KG_PER_LB * 10) / 10;
}
