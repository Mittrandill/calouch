import { useTranslations } from '@/i18n/LocaleProvider';

import { OptionList, type Option } from '../components/OptionList';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/** §8.2 "Birim sistemi". Varsayılan metrik önceden seçili — çoğu kullanıcı tek dokunuşla geçer. */
export function UnitStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();

  const options: Option<'metric' | 'imperial'>[] = [
    { value: 'metric', label: t.onboarding.unit.metric },
    { value: 'imperial', label: t.onboarding.unit.imperial },
  ];

  return (
    <StepShell
      title={t.onboarding.unit.title}
      subtitle={t.onboarding.unit.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed
    >
      <OptionList
        options={options}
        value={draft.unitSystem}
        onChange={(unitSystem) => updateDraft({ unitSystem })}
      />
    </StepShell>
  );
}
