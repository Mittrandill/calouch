import { Text } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { NumericField } from '../components/NumericField';
import { StepShell } from '../components/StepShell';
import { useCurrentYear } from '../useCurrentYear';
import type { StepProps } from './StepProps';

/**
 * §8.2 "Doğum yılı" — yalnız yıl, tam tarih değil (§09 veri minimizasyonu).
 * Aralık nutrition-engine'in assertValidInput sınırıyla (13-120 yaş) aynıdır.
 */
export function BirthYearStep({
  draft,
  updateDraft,
  onNext,
  onBack,
  currentIndex,
  totalSteps,
}: StepProps) {
  const t = useTranslations();
  const theme = useTheme();
  const currentYear = useCurrentYear();

  const age = draft.birthYear !== undefined ? currentYear - draft.birthYear : undefined;
  const canProceed = age !== undefined && age >= 13 && age <= 120;

  return (
    <StepShell
      title={t.onboarding.birthYear.title}
      subtitle={t.onboarding.birthYear.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <NumericField
        placeholder={t.onboarding.birthYear.placeholder}
        value={draft.birthYear?.toString() ?? ''}
        onChangeText={(text) => {
          const year = Number.parseInt(text, 10);
          updateDraft({ birthYear: Number.isNaN(year) ? undefined : year });
        }}
      />
      {draft.birthYear !== undefined && !canProceed && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
          ]}
        >
          {t.onboarding.validation.outOfRange}
        </Text>
      )}
    </StepShell>
  );
}
