import type { ActivityLevel } from '@calouch/nutrition-engine';

import { useTranslations } from '@/i18n/LocaleProvider';

import { OptionList, type Option } from '../components/OptionList';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/** §8.2 "Aktivite seviyesi" — hedef motoru için zorunlu (atlanabilir değil). */
export function ActivityStep({
  draft,
  updateDraft,
  onNext,
  onBack,
  currentIndex,
  totalSteps,
}: StepProps) {
  const t = useTranslations();

  const options: Option<ActivityLevel>[] = [
    { value: 'sedentary', label: t.onboarding.activity.sedentary, hint: t.onboarding.activity.sedentaryHint },
    { value: 'light', label: t.onboarding.activity.light, hint: t.onboarding.activity.lightHint },
    { value: 'moderate', label: t.onboarding.activity.moderate, hint: t.onboarding.activity.moderateHint },
    { value: 'active', label: t.onboarding.activity.active, hint: t.onboarding.activity.activeHint },
    { value: 'very_active', label: t.onboarding.activity.veryActive, hint: t.onboarding.activity.veryActiveHint },
  ];

  return (
    <StepShell
      title={t.onboarding.activity.title}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={draft.activityLevel !== undefined}
    >
      <OptionList
        options={options}
        value={draft.activityLevel}
        onChange={(activityLevel) => updateDraft({ activityLevel })}
      />
    </StepShell>
  );
}
