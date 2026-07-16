import { MAX_SUSTAINABLE_WEEKLY_CHANGE_KG } from '@calouch/nutrition-engine';
import { Text } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { NumericField } from '../components/NumericField';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/**
 * §8.2 "Haftalık hedef değişim". Yalnız kalori dengesini değiştiren
 * hedeflerde gösterilir (bkz. steps.ts `getActiveSteps`).
 *
 * Üst sınır (2 kg/hafta) engine'in assertValidInput sınırıyla aynı;
 * sürdürülebilir eşiğin (1 kg/hafta) üstü engellenmez, yalnız uyarılır —
 * motorun kendisi de aynı davranışı sergiler (§8.4).
 */
export function PaceStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();
  const theme = useTheme();

  const canProceed =
    draft.weeklyChangeKg !== undefined && draft.weeklyChangeKg > 0 && draft.weeklyChangeKg <= 2;
  const isTooFast =
    draft.weeklyChangeKg !== undefined && draft.weeklyChangeKg > MAX_SUSTAINABLE_WEEKLY_CHANGE_KG;

  return (
    <StepShell
      title={t.onboarding.pace.title}
      subtitle={t.onboarding.pace.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <NumericField
        placeholder="0.5"
        suffix={t.onboarding.pace.perWeek}
        value={draft.weeklyChangeKg?.toString() ?? ''}
        onChangeText={(text) => {
          const value = Number.parseFloat(text.replace(',', '.'));
          updateDraft({ weeklyChangeKg: Number.isNaN(value) ? undefined : value });
        }}
      />
      {isTooFast && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.warning, marginTop: theme.spacing.sm },
          ]}
        >
          {t.onboarding.pace.tooFastWarning}
        </Text>
      )}
    </StepShell>
  );
}
