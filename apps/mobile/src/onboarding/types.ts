import type { ActivityLevel, BiologicalSex, PrimaryGoal } from '@calouch/nutrition-engine';

/**
 * Onboarding taslağı — kullanıcının adım adım doldurduğu, henüz kaydedilmemiş
 * durum. Tüm alanlar opsiyoneldir: kullanıcı herhangi bir noktada uygulamayı
 * kapatabilir (§02 "Onboarding yarıda kalınca devam eder").
 *
 * Boy/kilo HER ZAMAN metrik (cm/kg) tutulur — DB'nin ve nutrition-engine'in
 * beklediği birim budur. `unitSystem` yalnız adımların hangi birimde
 * GÖSTERİLECEĞİni belirler; dönüşüm adım bileşeninin içinde olur.
 */
export type OnboardingDraft = {
  displayName?: string;
  unitSystem: 'metric' | 'imperial';
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  sex?: BiologicalSex;
  activityLevel?: ActivityLevel;
  primaryGoal?: PrimaryGoal;
  weeklyChangeKg?: number;
  dietPreference?: string;
  mealsPerDay?: number;
};

export const initialDraft: OnboardingDraft = {
  unitSystem: 'metric',
};

export type StepId =
  | 'name'
  | 'unit'
  | 'birthYear'
  | 'height'
  | 'weight'
  | 'sex'
  | 'activity'
  | 'goal'
  | 'pace'
  | 'diet'
  | 'summary';
