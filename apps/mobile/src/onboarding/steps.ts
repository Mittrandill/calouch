import { calorieDirection } from '@calouch/nutrition-engine';

import type { OnboardingDraft, StepId } from './types';

/**
 * Aktif adım listesi taslağa göre hesaplanır.
 *
 * 'pace' yalnız hedefin kalori dengesini değiştirdiği durumlarda gösterilir
 * (§8.3'teki sekiz hedeften yalnız üçü: kilo verme/alma/kas geliştirme).
 * `nutrition-engine`'in kendi `calorieDirection` fonksiyonu kullanılır ki
 * bu kural iki yerde ayrı ayrı tanımlanıp ayrışmasın.
 */
export function getActiveSteps(draft: OnboardingDraft): StepId[] {
  const steps: StepId[] = [
    'name',
    'unit',
    'birthYear',
    'height',
    'weight',
    'sex',
    'activity',
    'goal',
  ];

  if (draft.primaryGoal !== undefined && calorieDirection(draft.primaryGoal) !== 0) {
    steps.push('pace');
  }

  steps.push('diet', 'summary');
  return steps;
}

/** §8.2'de olmayan; hedef motoru için gerekli (14-open-decisions.md). */
export const SKIPPABLE_STEPS: readonly StepId[] = ['name', 'sex', 'diet'];

export function isSkippable(step: StepId): boolean {
  return SKIPPABLE_STEPS.includes(step);
}
