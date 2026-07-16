import type { PrimaryGoal } from '@calouch/nutrition-engine';

import { useTranslations } from '@/i18n/LocaleProvider';

import { OptionList, type Option } from '../components/OptionList';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/** §8.3 hedef listesi — birebir, zorunlu. */
export function GoalStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();

  const options: Option<PrimaryGoal>[] = [
    { value: 'lose_weight', label: t.onboarding.goal.loseWeight },
    { value: 'gain_weight', label: t.onboarding.goal.gainWeight },
    { value: 'maintain_weight', label: t.onboarding.goal.maintainWeight },
    { value: 'build_muscle', label: t.onboarding.goal.buildMuscle },
    { value: 'eat_healthy', label: t.onboarding.goal.eatHealthy },
    { value: 'increase_activity', label: t.onboarding.goal.increaseActivity },
    { value: 'training_routine', label: t.onboarding.goal.trainingRoutine },
    { value: 'improve_measurements', label: t.onboarding.goal.improveMeasurements },
  ];

  return (
    <StepShell
      title={t.onboarding.goal.title}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={draft.primaryGoal !== undefined}
    >
      <OptionList
        options={options}
        value={draft.primaryGoal}
        onChange={(primaryGoal) => updateDraft({ primaryGoal })}
      />
    </StepShell>
  );
}
