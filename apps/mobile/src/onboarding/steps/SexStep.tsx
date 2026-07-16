import type { BiologicalSex } from '@calouch/nutrition-engine';

import { useTranslations } from '@/i18n/LocaleProvider';

import { OptionList, type Option } from '../components/OptionList';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/**
 * §8.2'de yoktur; hedef motoru için eklendi ve atlanabilir
 * (karar: 14-open-decisions.md "Onboarding'e biyolojik cinsiyet alanı eklendi").
 */
export function SexStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();

  const options: Option<BiologicalSex>[] = [
    { value: 'male', label: t.onboarding.sex.male },
    { value: 'female', label: t.onboarding.sex.female },
  ];

  const handleSkip = () => {
    updateDraft({ sex: 'unspecified' });
    onNext();
  };

  return (
    <StepShell
      title={t.onboarding.sex.title}
      subtitle={t.onboarding.sex.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      onSkip={handleSkip}
      canProceed={draft.sex !== undefined}
      nextLabel={t.onboarding.next}
    >
      <OptionList
        options={options}
        value={draft.sex === 'unspecified' ? undefined : draft.sex}
        onChange={(sex) => updateDraft({ sex })}
      />
    </StepShell>
  );
}
