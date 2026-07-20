import { requiresProfessionalAdviceNotice, type GoalResult } from '@calouch/nutrition-engine';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { StepShell } from '../components/StepShell';

type Props = {
  goals: GoalResult | null;
  onFinish: () => void;
  onBack?: () => void;
  isSaving: boolean;
  currentIndex: number;
  totalSteps: number;
};

/**
 * §8.4 sonuç ekranı.
 *
 * §00 "Belirsizlik görünürdür": cinsiyet belirtilmediyse bu bir yaklaşım
 * olduğu açıkça söylenir. §8.4: riskli düşük hedefte kullanıcı uyarılır ve
 * profesyonel destek önerilir — bu ürün tıbbi tavsiye vermez (§00).
 */
export function SummaryStep({ goals, onFinish, onBack, isSaving, currentIndex, totalSteps }: Props) {
  const t = useTranslations();
  const theme = useTheme();

  if (goals === null) {
    // Beklenmeyen durum: önceki adımlar zorunlu alanları tamamlatmış olmalı.
    // Kullanıcıyı geri gönderip yeniden denemesine izin ver.
    return (
      <StepShell
        title={t.onboarding.summary.title}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={() => onBack?.()}
        canProceed={onBack !== undefined}
        nextLabel={t.onboarding.back}
      >
        <Text style={[theme.typography.body, { color: theme.colors.status.danger }]}>
          {t.common.error}
        </Text>
      </StepShell>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: t.onboarding.summary.calories, value: `${goals.targetCalories} kcal` },
    { label: t.onboarding.summary.protein, value: `${goals.macros.proteinG} g` },
    { label: t.onboarding.summary.carbs, value: `${goals.macros.carbsG} g` },
    { label: t.onboarding.summary.fat, value: `${goals.macros.fatG} g` },
    { label: t.onboarding.summary.fiber, value: `${goals.macros.fiberG} g` },
    { label: t.onboarding.summary.water, value: `${goals.waterMl} ml` },
  ];

  const showProfessionalAdvice = requiresProfessionalAdviceNotice(goals.warnings);

  return (
    <StepShell
      title={t.onboarding.summary.title}
      subtitle={t.onboarding.summary.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onFinish}
      canProceed
      isSaving={isSaving}
      nextLabel={t.onboarding.summary.finish}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.row,
              {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border.default,
              },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
              {row.label}
            </Text>
            <Text style={[theme.typography.numeric, { color: theme.colors.text.primary }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {goals.confidence === 'low' && (
        <Note
          text={t.onboarding.summary.lowConfidenceNote}
          color={theme.colors.text.secondary}
        />
      )}
      {goals.warnings.includes('target_below_safe_minimum') && (
        <Note
          text={t.onboarding.summary.warningBelowSafeMinimum}
          color={theme.colors.status.warning}
        />
      )}
      {goals.warnings.includes('target_below_bmr') && (
        <Note text={t.onboarding.summary.warningBelowBmr} color={theme.colors.status.warning} />
      )}
      {goals.warnings.includes('weekly_change_too_fast') && (
        <Note text={t.onboarding.summary.warningTooFast} color={theme.colors.status.warning} />
      )}
      {showProfessionalAdvice && (
        <Note
          text={t.onboarding.summary.professionalAdviceNotice}
          color={theme.colors.status.danger}
        />
      )}
    </StepShell>
  );
}

function Note({ text, color }: { text: string; color: string }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="alert"
      style={[theme.typography.bodySm, { color, marginTop: theme.spacing.md }]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
