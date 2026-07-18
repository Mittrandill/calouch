import type { MealDraft } from '@calouch/types';
import { sumCatalogNutrients } from '@calouch/nutrition-engine';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { defaultMealTypeForNow, useLogMeal, type LogMealItem, type MealType } from '@/data/meals';
import { OptionList, type Option } from '@/onboarding/components/OptionList';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { MealDraftItemRow } from './MealDraftItemRow';
import { initialDraftItemState, previewNutrients, resolvedFoodId, type DraftItemState } from './mealDraftPreview';

type Props = {
  draft: MealDraft;
  onReanalyze: () => void;
  isReanalyzing: boolean;
  onDiscard: () => void;
  onSaved: () => void;
};

/**
 * MVP-10: AI taslağını düzenlenebilir/onaylanabilir hale getirir.
 *
 * Değişmez kural (§04/§10/§11): "AI yalnızca tahmin veya taslak üretir;
 * kullanıcı onayı olmadan öğün kalıcılaşmaz." Kaydetme, yeni bir RPC değil,
 * mevcut `public.log_meal()` yazma yolu üzerinden olur — onaylanan her kalem
 * normal bir `{kind:'food'}` kalemi olarak gönderilir (bkz.
 * `docs/prd/13-agent-work-orders.md` MVP-10 notu).
 *
 * Üst bileşen (camera.tsx) yeni bir analiz sonucunda bu bileşeni `key={jobId}`
 * ile YENİDEN MOUNT eder — böylece aşağıdaki state yeni taslağa göre sıfırdan
 * başlar, elle senkronize etmeye gerek kalmaz.
 */
export function MealDraftReview({ draft, onReanalyze, isReanalyzing, onDiscard, onSaved }: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const logMeal = useLogMeal();

  const [itemStates, setItemStates] = useState<DraftItemState[]>(() =>
    draft.items.map((item) => initialDraftItemState(item)),
  );
  const [mealType, setMealType] = useState<MealType>(defaultMealTypeForNow);
  const [saveError, setSaveError] = useState<string | null>(null);

  const mealTypeOptions: Option<MealType>[] = useMemo(
    () => [
      { value: 'breakfast', label: t.diary.mealTypes.breakfast },
      { value: 'lunch', label: t.diary.mealTypes.lunch },
      { value: 'snack', label: t.diary.mealTypes.snack },
      { value: 'dinner', label: t.diary.mealTypes.dinner },
      { value: 'pre_workout', label: t.diary.mealTypes.pre_workout },
      { value: 'post_workout', label: t.diary.mealTypes.post_workout },
      { value: 'night', label: t.diary.mealTypes.night },
    ],
    [t],
  );

  const includedNutrients = draft.items
    .map((item, index) => previewNutrients(item, itemStates[index]!))
    .filter((value) => value !== null);
  const liveTotal = includedNutrients.length > 0 ? sumCatalogNutrients(includedNutrients) : null;

  const saveItems: LogMealItem[] = [];
  draft.items.forEach((item, index) => {
    const state = itemStates[index]!;
    if (!state.included) return;
    const foodId = resolvedFoodId(item, state);
    const nutrients = previewNutrients(item, state);
    if (foodId === null || nutrients === null) return;
    const grams = Number.parseFloat(state.gramsInput.replace(',', '.'));
    saveItems.push({ kind: 'food', foodId, quantityGrams: grams });
  });
  const canSave = saveItems.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    try {
      await logMeal.mutateAsync({ mealType, loggedAt: new Date(), items: saveItems });
      onSaved();
    } catch {
      setSaveError(t.diary.error.save);
    }
  };

  const updateItemState = (index: number, next: DraftItemState) => {
    setItemStates((current) => current.map((state, i) => (i === index ? next : state)));
  };

  return (
    <View style={{ marginTop: theme.spacing.xl }}>
      <Text
        style={[
          theme.typography.bodySm,
          { color: theme.colors.text.tertiary, marginBottom: theme.spacing.lg, fontStyle: 'italic' },
        ]}
      >
        {t.camera.previewNotice}
      </Text>

      {draft.overallConfidence === 'low' && (
        <View
          accessibilityRole="alert"
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.status.warningSurface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.status.warning }]}>
            {t.camera.review.lowConfidenceBanner}
          </Text>
        </View>
      )}

      <Text accessibilityRole="header" style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>
        {t.camera.resultTitle}
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.text.primary, marginTop: theme.spacing.xs }]}>
        {draft.mealTitle}
      </Text>

      {liveTotal !== null && (
        <Text style={[theme.typography.label, { color: theme.colors.brand.text, marginTop: theme.spacing.sm }]}>
          {t.camera.totalEstimateLabel}: {Math.round(liveTotal.energyKcal)} kcal ·{' '}
          {Math.round(liveTotal.proteinG * 10) / 10}g {t.camera.proteinLabel} ·{' '}
          {Math.round(liveTotal.carbsG * 10) / 10}g {t.camera.carbsLabel} ·{' '}
          {Math.round(liveTotal.fatG * 10) / 10}g {t.camera.fatLabel}
        </Text>
      )}

      {draft.items.map((item, index) => (
        <MealDraftItemRow
          key={index}
          item={item}
          state={itemStates[index]!}
          onChange={(next) => updateItemState(index, next)}
        />
      ))}

      <View style={{ marginTop: theme.spacing.xl }}>
        <Text
          style={[theme.typography.label, { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }]}
        >
          {t.diary.quantity.mealTypeLabel}
        </Text>
        <OptionList options={mealTypeOptions} value={mealType} onChange={setMealType} />
      </View>

      {saveError !== null && (
        <Text
          accessibilityRole="alert"
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.danger, marginTop: theme.spacing.md },
          ]}
        >
          {saveError}
        </Text>
      )}

      <Pressable
        onPress={() => void handleSave()}
        disabled={!canSave || logMeal.isPending}
        accessibilityRole="button"
        accessibilityLabel={t.camera.review.confirmAndSave}
        accessibilityState={{ disabled: !canSave || logMeal.isPending, busy: logMeal.isPending }}
        style={({ pressed }) => [
          styles.actionButton,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.xxl,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            opacity: canSave ? 1 : 0.5,
          },
        ]}
      >
        {logMeal.isPending ? (
          <ActivityIndicator color={theme.colors.brand.onBrand} />
        ) : (
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.camera.review.confirmAndSave}
          </Text>
        )}
      </Pressable>

      <View style={[styles.secondaryRow, { marginTop: theme.spacing.md, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={onReanalyze}
          disabled={isReanalyzing || logMeal.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.camera.review.reanalyze}
          style={({ pressed }) => [
            styles.actionButton,
            {
              flex: 1,
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border.default,
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              opacity: isReanalyzing || logMeal.isPending ? 0.5 : 1,
            },
          ]}
        >
          {isReanalyzing ? (
            <ActivityIndicator color={theme.colors.brand.text} />
          ) : (
            <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
              {t.camera.review.reanalyze}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onDiscard}
          disabled={logMeal.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.camera.review.discard}
          style={{ minHeight: theme.minTouchTarget, justifyContent: 'center', paddingHorizontal: theme.spacing.md }}
        >
          <Text style={[theme.typography.label, { color: theme.colors.text.secondary }]}>
            {t.camera.review.discard}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {},
  actionButton: { alignItems: 'center', justifyContent: 'center' },
  secondaryRow: { flexDirection: 'row', alignItems: 'center' },
});
