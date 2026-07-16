import { View } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { NumericField } from '../components/NumericField';
import { OptionList, type Option } from '../components/OptionList';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/**
 * §8.2 "Beslenme tercihi" ve "Günlük öğün düzeni" — ikisi de atlanabilir.
 *
 * `diet_preference` DB'de serbest metin sütunudur (CHECK kısıtı yok);
 * burada sunulan seçenekler bir sözleşme değil, önerilen bir başlangıç
 * kümesidir.
 */
export function DietStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();
  const theme = useTheme();

  const options: Option<string>[] = [
    { value: 'omnivore', label: t.onboarding.diet.omnivore },
    { value: 'vegetarian', label: t.onboarding.diet.vegetarian },
    { value: 'vegan', label: t.onboarding.diet.vegan },
    { value: 'pescatarian', label: t.onboarding.diet.pescatarian },
    { value: 'other', label: t.onboarding.diet.other },
  ];

  return (
    <StepShell
      title={t.onboarding.diet.title}
      subtitle={t.onboarding.diet.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      onSkip={onNext}
      canProceed
    >
      <OptionList
        options={options}
        value={draft.dietPreference}
        onChange={(dietPreference) => updateDraft({ dietPreference })}
      />
      <View style={{ marginTop: theme.spacing.lg }}>
        <NumericField
          label={t.onboarding.diet.mealsPerDayLabel}
          placeholder="3"
          value={draft.mealsPerDay?.toString() ?? ''}
          onChangeText={(text) => {
            const value = Number.parseInt(text, 10);
            updateDraft({
              mealsPerDay: Number.isNaN(value) ? undefined : Math.min(10, Math.max(1, value)),
            });
          }}
        />
      </View>
    </StepShell>
  );
}
