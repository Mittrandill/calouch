import { calculateGoals, type GoalResult } from '@calouch/nutrition-engine';
import type { ProfileUpdate } from '@calouch/types';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useTranslations } from '@/i18n/LocaleProvider';
import { getActiveSteps } from '@/onboarding/steps';
import { ActivityStep } from '@/onboarding/steps/ActivityStep';
import { BirthYearStep } from '@/onboarding/steps/BirthYearStep';
import { DietStep } from '@/onboarding/steps/DietStep';
import { GoalStep } from '@/onboarding/steps/GoalStep';
import { HeightStep } from '@/onboarding/steps/HeightStep';
import { NameStep } from '@/onboarding/steps/NameStep';
import { PaceStep } from '@/onboarding/steps/PaceStep';
import { SexStep } from '@/onboarding/steps/SexStep';
import { SummaryStep } from '@/onboarding/steps/SummaryStep';
import { UnitStep } from '@/onboarding/steps/UnitStep';
import { WeightStep } from '@/onboarding/steps/WeightStep';
import type { StepId } from '@/onboarding/types';
import { useCurrentYear } from '@/onboarding/useCurrentYear';
import { useOnboardingDraft } from '@/onboarding/useDraft';
import { useTheme } from '@/theme/ThemeProvider';
import { useUpdateProfile } from '@/data/profile';

/**
 * Onboarding wizard'ı.
 *
 * §02: "Onboarding yarıda kalınca devam eder; izin reddi bloklamaz."
 * Taslak yerelde tutulur (useOnboardingDraft); yalnız SON adımda tek bir
 * profil güncellemesiyle sunucuya yazılır — yarım onboarding sunucuda hiç
 * görünmez.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring: isAuthRestoring } = useAuth();
  const { draft, updateDraft, stepIndex, setStepIndex, isRestoring: isDraftRestoring, clearDraft } =
    useOnboardingDraft();
  const updateProfile = useUpdateProfile();
  const currentYear = useCurrentYear();
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeSteps = getActiveSteps(draft);
  const clampedIndex = Math.min(stepIndex, activeSteps.length - 1);
  const currentStepId: StepId = activeSteps[clampedIndex] ?? 'name';

  const goals = useMemo<GoalResult | null>(() => {
    if (currentStepId !== 'summary') return null;
    if (
      draft.birthYear === undefined ||
      draft.heightCm === undefined ||
      draft.weightKg === undefined ||
      draft.targetWeightKg === undefined ||
      draft.activityLevel === undefined ||
      draft.primaryGoal === undefined
    ) {
      return null;
    }
    try {
      return calculateGoals({
        birthYear: draft.birthYear,
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        targetWeightKg: draft.targetWeightKg,
        sex: draft.sex ?? 'unspecified',
        activityLevel: draft.activityLevel,
        primaryGoal: draft.primaryGoal,
        weeklyChangeKg: draft.weeklyChangeKg ?? 0,
        currentYear,
      });
    } catch {
      // Adım geçişleri zorunlu alanları zaten doğruladı; buraya düşülmesi
      // beklenmez. Yine de kullanıcı geri gönderilip yeniden deneyebilir.
      return null;
    }
  }, [currentStepId, draft, currentYear]);

  const goToNext = () => setStepIndex(Math.min(clampedIndex + 1, activeSteps.length - 1));
  const goToBack = () => setStepIndex(Math.max(clampedIndex - 1, 0));

  const handleFinish = async () => {
    if (goals === null) return;
    setSaveError(null);

    const patch: ProfileUpdate = {
      display_name: draft.displayName?.trim() === '' ? null : (draft.displayName ?? null),
      unit_system: draft.unitSystem,
      birth_year: draft.birthYear,
      height_cm: draft.heightCm,
      weight_kg: draft.weightKg,
      target_weight_kg: draft.targetWeightKg,
      biological_sex: draft.sex ?? 'unspecified',
      activity_level: draft.activityLevel,
      primary_goal: draft.primaryGoal,
      weekly_change_kg: draft.weeklyChangeKg ?? 0,
      diet_preference: draft.dietPreference ?? null,
      meals_per_day: draft.mealsPerDay ?? null,

      bmr_kcal: goals.bmr,
      tdee_kcal: goals.tdee,
      target_calories_kcal: goals.targetCalories,
      protein_g: goals.macros.proteinG,
      carbs_g: goals.macros.carbsG,
      fat_g: goals.macros.fatG,
      fiber_g: goals.macros.fiberG,
      water_ml: goals.waterMl,
      goal_formula_version: goals.formulaVersion,
      goals_confidence: goals.confidence,
      goal_warnings: goals.warnings,
      goals_calculated_at: new Date().toISOString(),

      onboarding_completed_at: new Date().toISOString(),
    };

    try {
      await updateProfile.mutateAsync(patch);
      await clearDraft();
      router.replace('/(tabs)');
    } catch {
      // §12: ağ hatası kullanıcıya suç yüklemeden anlatılır; sunucu mesajı
      // gösterilmez (§09 log/UI redaksiyonu).
      setSaveError(t.authError.network);
    }
  };

  if (isAuthRestoring || isDraftRestoring) {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background.default }]}
        accessibilityLabel={t.common.loading}
      >
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const shared = {
    draft,
    updateDraft,
    onNext: goToNext,
    onBack: clampedIndex > 0 ? goToBack : undefined,
    currentIndex: clampedIndex,
    totalSteps: activeSteps.length,
  };

  return (
    <>
      {currentStepId === 'name' && <NameStep {...shared} />}
      {currentStepId === 'unit' && <UnitStep {...shared} />}
      {currentStepId === 'birthYear' && <BirthYearStep {...shared} />}
      {currentStepId === 'height' && <HeightStep {...shared} />}
      {currentStepId === 'weight' && <WeightStep {...shared} />}
      {currentStepId === 'sex' && <SexStep {...shared} />}
      {currentStepId === 'activity' && <ActivityStep {...shared} />}
      {currentStepId === 'goal' && <GoalStep {...shared} />}
      {currentStepId === 'pace' && <PaceStep {...shared} />}
      {currentStepId === 'diet' && <DietStep {...shared} />}
      {currentStepId === 'summary' && (
        <SummaryStep
          goals={goals}
          onFinish={() => void handleFinish()}
          onBack={shared.onBack}
          isSaving={updateProfile.isPending}
          currentIndex={clampedIndex}
          totalSteps={activeSteps.length}
        />
      )}
      {saveError !== null && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: theme.colors.status.dangerSurface, padding: theme.spacing.md },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.status.danger }]}>
            {saveError}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
