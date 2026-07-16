import {
  GOAL_FORMULA_VERSION,
  MAX_SUSTAINABLE_WEEKLY_CHANGE_KG,
  SAFE_MINIMUM_CALORIES,
} from './constants';
import {
  ageFromBirthYear,
  basalMetabolicRate,
  dailyCalorieDelta,
  totalDailyEnergyExpenditure,
} from './energy';
import { macroTargets, referenceWeightKg, waterTargetMl } from './macros';
import type { GoalInput, GoalResult, GoalWarning } from './types';

export class GoalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoalInputError';
  }
}

/**
 * Girdi doğrulaması.
 *
 * Motor kendi girdisini savunur: çağıran katman (form, AI, import) değişebilir
 * ama saçma girdinin sessizce hedefe dönüşmemesi motorun sorumluluğudur.
 * Sınırlar tıbbi karar değil, fiziksel akla yatkınlık kontrolüdür.
 */
function assertValidInput(input: GoalInput): void {
  const age = ageFromBirthYear(input.birthYear, input.currentYear);

  if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 500) {
    throw new GoalInputError(`Kilo aralık dışı: ${input.weightKg} kg`);
  }
  if (!Number.isFinite(input.targetWeightKg) || input.targetWeightKg < 20 || input.targetWeightKg > 500) {
    throw new GoalInputError(`Hedef kilo aralık dışı: ${input.targetWeightKg} kg`);
  }
  if (!Number.isFinite(input.heightCm) || input.heightCm < 80 || input.heightCm > 260) {
    throw new GoalInputError(`Boy aralık dışı: ${input.heightCm} cm`);
  }
  if (!Number.isFinite(age) || age < 13 || age > 120) {
    // 13 altı bilinçli: çocuk/ergen kalori hedefi büyüme eğrisi gerektirir ve
    // bu ürünün kapsamı dışındadır (§00 "teşhis/tedavi vermez").
    throw new GoalInputError(`Yaş aralık dışı: ${age}`);
  }
  if (!Number.isFinite(input.weeklyChangeKg) || input.weeklyChangeKg < 0 || input.weeklyChangeKg > 2) {
    throw new GoalInputError(`Haftalık değişim aralık dışı: ${input.weeklyChangeKg} kg/hafta`);
  }
}

/**
 * PRD §8.4 günlük hedef hesabı.
 *
 * Deterministiktir: aynı girdi her zaman aynı çıktıyı verir, saat/rastgelelik
 * yoktur. Bu, §00'ın değişmez kuralının temelidir — "Kalori ve makrolar AI
 * metninden değil, sürümlü besin verisi ve deterministik hesap motorundan
 * gelir."
 */
export function calculateGoals(input: GoalInput): GoalResult {
  assertValidInput(input);

  const warnings: GoalWarning[] = [];

  const age = ageFromBirthYear(input.birthYear, input.currentYear);
  const bmr = basalMetabolicRate({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age,
    sex: input.sex,
  });
  const tdee = totalDailyEnergyExpenditure(bmr, input.activityLevel);

  if (input.sex === 'unspecified') {
    // §00 "Belirsizlik görünürdür": orta noktadan yürüyen hesap ±83 kcal
    // sapabilir ve bu kullanıcıdan saklanmaz.
    warnings.push('sex_unspecified');
  }

  if (input.weeklyChangeKg > MAX_SUSTAINABLE_WEEKLY_CHANGE_KG) {
    warnings.push('weekly_change_too_fast');
  }

  const desiredCalories = tdee + dailyCalorieDelta(input.primaryGoal, input.weeklyChangeKg);

  // §8.4: "Riskli derecede düşük hedeflerde kullanıcı uyarılır ve profesyonel
  // destek önerilir." Motorun KENDİ önerisi güvenli tabanın altına inmez;
  // kullanıcı dilerse elle daha düşüğe çeker, o zaman sorumluluk açıkça onda.
  const safeMinimum = SAFE_MINIMUM_CALORIES[input.sex];
  let targetCalories = desiredCalories;

  if (desiredCalories < safeMinimum) {
    warnings.push('target_below_safe_minimum');
    targetCalories = safeMinimum;
  }

  // Taban uygulandıktan SONRA kontrol edilir: kırpılmış hedef hâlâ bazal
  // metabolizmanın altındaysa, bu kullanıcı için taban da yeterli değildir.
  if (targetCalories < bmr) {
    warnings.push('target_below_bmr');
  }

  const macros = macroTargets({
    targetCalories,
    referenceWeightKg: referenceWeightKg(input),
    primaryGoal: input.primaryGoal,
  });

  return {
    bmr,
    tdee,
    targetCalories,
    macros,
    waterMl: waterTargetMl(input.weightKg),
    confidence: input.sex === 'unspecified' ? 'low' : 'high',
    warnings,
    formulaVersion: GOAL_FORMULA_VERSION,
  };
}

/**
 * Uyarının kullanıcıya profesyonel destek önerilmesini gerektirip
 * gerektirmediği (§8.4).
 *
 * §00: ürün teşhis/tedavi vermez — yapabileceği tek şey riski işaret edip
 * uzmana yönlendirmektir.
 */
export function requiresProfessionalAdviceNotice(warnings: readonly GoalWarning[]): boolean {
  return warnings.includes('target_below_safe_minimum') || warnings.includes('target_below_bmr');
}
