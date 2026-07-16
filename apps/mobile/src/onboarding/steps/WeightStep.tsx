import { kgToLb, lbToKg } from '@calouch/nutrition-engine';
import { View } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { NumericField } from '../components/NumericField';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/** §8.2 "Kilo" ve "Hedef kilo". Depolama her zaman kg. */
export function WeightStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();
  const theme = useTheme();
  const isImperial = draft.unitSystem === 'imperial';
  const suffix = isImperial ? t.onboarding.weight.placeholderLb : t.onboarding.weight.placeholderKg;

  const canProceed =
    draft.weightKg !== undefined &&
    draft.weightKg >= 20 &&
    draft.weightKg <= 500 &&
    draft.targetWeightKg !== undefined &&
    draft.targetWeightKg >= 20 &&
    draft.targetWeightKg <= 500;

  const toDisplay = (kg: number | undefined): string => {
    if (kg === undefined) return '';
    return isImperial ? kgToLb(kg).toString() : kg.toString();
  };

  const parseInput = (text: string): number | undefined => {
    const value = Number.parseFloat(text.replace(',', '.'));
    if (Number.isNaN(value)) return undefined;
    return isImperial ? lbToKg(value) : value;
  };

  return (
    <StepShell
      title={t.onboarding.weight.title}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <NumericField
        label={t.onboarding.weight.current}
        placeholder={suffix}
        suffix={suffix}
        value={toDisplay(draft.weightKg)}
        onChangeText={(text) => updateDraft({ weightKg: parseInput(text) })}
      />
      <View style={{ marginTop: theme.spacing.lg }}>
        <NumericField
          label={t.onboarding.weight.target}
          placeholder={suffix}
          suffix={suffix}
          value={toDisplay(draft.targetWeightKg)}
          onChangeText={(text) => updateDraft({ targetWeightKg: parseInput(text) })}
        />
      </View>
    </StepShell>
  );
}
