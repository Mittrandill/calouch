import {
  ACTIVITY_MULTIPLIER,
  KCAL_PER_KG_BODY_FAT,
  MIFFLIN_SEX_CONSTANT,
} from './constants';
import type { ActivityLevel, BiologicalSex, PrimaryGoal } from './types';

/** PRD §8.2 yalnız doğum yılı topluyor; yaş bu yüzden yıl farkıdır (±1 yıl). */
export function ageFromBirthYear(birthYear: number, currentYear: number): number {
  return currentYear - birthYear;
}

/**
 * Bazal metabolizma — Mifflin-St Jeor (1990).
 *
 * BMR = 10·kg + 6.25·cm − 5·yaş + s
 */
export function basalMetabolicRate(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
}): number {
  const raw =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.age +
    MIFFLIN_SEX_CONSTANT[input.sex];

  // Uç girdilerde (çok düşük kilo + ileri yaş) formül teorik olarak negatife
  // inebilir. Negatif bazal metabolizma anlamsızdır ve aşağı akışta sıfıra
  // bölme/negatif makro üretir.
  return Math.max(0, Math.round(raw));
}

/** Günlük enerji ihtiyacı. */
export function totalDailyEnergyExpenditure(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel]);
}

/**
 * Hedefin kalori yönü.
 *
 * §8.3'teki sekiz hedefin yalnız üçü kalori dengesini değiştirir. "Sağlıklı
 * beslenmek" veya "antrenman düzeni oluşturmak" seçen kullanıcıya açık/fazla
 * dayatmak, istemediği bir kilo değişimi üretirdi.
 */
export function calorieDirection(goal: PrimaryGoal): -1 | 0 | 1 {
  switch (goal) {
    case 'lose_weight':
      return -1;
    case 'gain_weight':
    case 'build_muscle':
      return 1;
    case 'maintain_weight':
    case 'eat_healthy':
    case 'increase_activity':
    case 'training_routine':
    case 'improve_measurements':
      return 0;
  }
}

/**
 * Haftalık kilo değişimi hedefini günlük kalori farkına çevirir.
 * `weeklyChangeKg` işaretsizdir; yönü hedef belirler.
 */
export function dailyCalorieDelta(goal: PrimaryGoal, weeklyChangeKg: number): number {
  const direction = calorieDirection(goal);
  if (direction === 0) return 0;

  const magnitude = Math.abs(weeklyChangeKg);
  return Math.round((direction * magnitude * KCAL_PER_KG_BODY_FAT) / 7);
}
