import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useDailyNutritionSummary, useTodaysMeals, type LoggedMeal } from '@/data/meals';
import { useProfile } from '@/data/profile';
import { useDailyWaterSummary, useLogWater } from '@/data/water';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §03 manuel öğün günlüğü — MVP-05/MVP-06. */
export default function DiaryScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const summary = useDailyNutritionSummary(today);
  const meals = useTodaysMeals(today);

  return (
    <Screen scrollable>
      <Text
        accessibilityRole="header"
        style={[theme.typography.display, { color: theme.colors.text.primary }]}
      >
        {t.diary.title}
      </Text>

      <SummaryCard
        isLoading={summary.isPending}
        totalEnergyKcal={summary.data?.totalEnergyKcal ?? null}
        totalProteinG={summary.data?.totalProteinG ?? null}
        totalCarbsG={summary.data?.totalCarbsG ?? null}
        totalFatG={summary.data?.totalFatG ?? null}
      />

      <WaterCard date={today} />

      <Pressable
        onPress={() => router.push('/add-meal')}
        accessibilityRole="button"
        accessibilityLabel={t.diary.addMeal}
        style={({ pressed }) => [
          styles.addButton,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.lg,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
          },
        ]}
      >
        <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
          + {t.diary.addMeal}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/recipes')}
        accessibilityRole="button"
        accessibilityLabel={t.recipes.title}
        style={{ minHeight: theme.minTouchTarget, marginTop: theme.spacing.sm, justifyContent: 'center' }}
      >
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, textAlign: 'center' },
          ]}
        >
          {t.recipes.title}
        </Text>
      </Pressable>

      <View style={{ marginTop: theme.spacing.xl }}>
        {meals.isPending && <ActivityIndicator color={theme.colors.brand.text} />}

        {meals.data !== undefined && meals.data.length === 0 && (
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.tertiary, textAlign: 'center', marginTop: theme.spacing.xl },
            ]}
          >
            {t.diary.empty}
          </Text>
        )}

        {meals.data?.map((meal) => <MealCard key={meal.id} meal={meal} />)}
      </View>
    </Screen>
  );
}

function SummaryCard({
  isLoading,
  totalEnergyKcal,
  totalProteinG,
  totalCarbsG,
  totalFatG,
}: {
  isLoading: boolean;
  totalEnergyKcal: number | null;
  totalProteinG: number | null;
  totalCarbsG: number | null;
  totalFatG: number | null;
}) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: theme.spacing.lg,
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.lg,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <>
          <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
            {totalEnergyKcal === null ? '—' : Math.round(totalEnergyKcal)}{' '}
            <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>
              {t.diary.calories}
            </Text>
          </Text>
          <View style={[styles.macroRow, { marginTop: theme.spacing.md, gap: theme.spacing.lg }]}>
            <MacroValue color={theme.colors.macro.protein} label="P" grams={totalProteinG} />
            <MacroValue color={theme.colors.macro.carbs} label="K" grams={totalCarbsG} />
            <MacroValue color={theme.colors.macro.fat} label="Y" grams={totalFatG} />
          </View>
        </>
      )}
    </View>
  );
}

function MacroValue({ color, label, grams }: { color: string; label: string; grams: number | null }) {
  const theme = useTheme();
  return (
    <View style={styles.macroItem}>
      {/* §02: makrolar yalnızca renkle ayrılmaz — harf etiketi taşır. */}
      <View
        style={[
          styles.macroDot,
          {
            backgroundColor: color,
            marginRight: theme.spacing.xs,
            width: theme.spacing.sm,
            height: theme.spacing.sm,
            borderRadius: theme.radius.full,
          },
        ]}
        accessibilityElementsHidden
      />
      <Text style={[theme.typography.numericSm, { color: theme.colors.text.primary }]}>
        {label}: {grams === null ? '—' : `${Math.round(grams)}g`}
      </Text>
    </View>
  );
}

/** §03 su takibi: tek dokunuş, son kullanılan miktar, özel miktar. */
const QUICK_AMOUNTS_ML = [200, 250, 330, 500];

function WaterCard({ date }: { date: Date }) {
  const theme = useTheme();
  const t = useTranslations();

  const profile = useProfile();
  const summary = useDailyWaterSummary(date);
  const logWater = useLogWater();

  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const goalMl = profile.data?.water_ml ?? null;
  const consumedMl = summary.data?.totalMl ?? 0;
  const lastAmountMl = summary.data?.lastAmountMl ?? null;

  // §03 "son kullanılan miktar" tek dokunuş varsayılanı olarak öne çıkar;
  // yaygın bardak/şişe boylarıyla çakışıyorsa tekrar listelenmez.
  const quickAmounts = useMemo(() => {
    const amounts =
      lastAmountMl !== null && !QUICK_AMOUNTS_ML.includes(lastAmountMl)
        ? [lastAmountMl, ...QUICK_AMOUNTS_ML]
        : QUICK_AMOUNTS_ML;
    return amounts.slice(0, 5);
  }, [lastAmountMl]);

  const customAmountValue = Number.parseInt(customAmount, 10);
  const canAddCustom = Number.isFinite(customAmountValue) && customAmountValue > 0;

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: theme.spacing.md,
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <View style={styles.mealHeader}>
        <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>
          {t.diary.water.title}
        </Text>
        <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
          {consumedMl}
          {goalMl !== null ? ` / ${goalMl}` : ''} {t.diary.water.unit}
        </Text>
      </View>

      <View
        style={[
          styles.chipRow,
          { marginTop: theme.spacing.md, gap: theme.spacing.sm },
        ]}
      >
        {quickAmounts.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => logWater.mutate(amount)}
            disabled={logWater.isPending}
            accessibilityRole="button"
            accessibilityLabel={`+ ${amount} ${t.diary.water.unit}`}
            style={({ pressed }) => [
              styles.chip,
              {
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                borderColor: theme.colors.status.info,
                backgroundColor: pressed
                  ? theme.colors.surface.pressed
                  : theme.colors.surface.default,
                opacity: logWater.isPending ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[theme.typography.bodySm, { color: theme.colors.status.info }]}>
              +{amount}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setShowCustom((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={t.diary.water.customAmount}
          style={({ pressed }) => [
            styles.chip,
            {
              minHeight: theme.minTouchTarget,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.full,
              borderColor: theme.colors.border.default,
              backgroundColor: pressed
                ? theme.colors.surface.pressed
                : theme.colors.surface.default,
            },
          ]}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
            {t.diary.water.customAmount}
          </Text>
        </Pressable>
      </View>

      {showCustom && (
        <View style={[styles.chipRow, { marginTop: theme.spacing.sm, gap: theme.spacing.sm }]}>
          <TextInput
            value={customAmount}
            onChangeText={(text) => setCustomAmount(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={t.diary.water.customAmountLabel}
            placeholderTextColor={theme.colors.text.tertiary}
            accessibilityLabel={t.diary.water.customAmountLabel}
            style={[
              styles.customAmountInput,
              theme.typography.numeric,
              {
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
          />
          <Pressable
            onPress={() => {
              if (!canAddCustom) return;
              logWater.mutate(customAmountValue);
              setCustomAmount('');
              setShowCustom(false);
            }}
            disabled={!canAddCustom || logWater.isPending}
            accessibilityRole="button"
            accessibilityLabel={t.diary.water.add}
            style={({ pressed }) => [
              styles.chip,
              {
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
                opacity: canAddCustom ? 1 : 0.5,
              },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
              {t.diary.water.add}
            </Text>
          </Pressable>
        </View>
      )}

      {logWater.isError && (
        <Text
          accessibilityRole="alert"
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
          ]}
        >
          {t.diary.water.error}
        </Text>
      )}
    </View>
  );
}

function MealCard({ meal }: { meal: LoggedMeal }) {
  const theme = useTheme();
  const t = useTranslations();

  const totalKcal = meal.items.reduce((sum, item) => sum + item.energyKcal, 0);
  const title = meal.mealType === 'custom' ? (meal.customLabel ?? '') : t.diary.mealTypes[meal.mealType];

  return (
    <View
      style={[
        styles.card,
        {
          marginBottom: theme.spacing.md,
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <View style={styles.mealHeader}>
        <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
          {Math.round(totalKcal)} {t.diary.calories}
        </Text>
      </View>
      {meal.items.map((item) => (
        <View
          key={item.id}
          style={[styles.itemRow, { marginTop: theme.spacing.xs }]}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
            {item.kind === 'recipe'
              ? `${item.recipeName} × ${item.servings}`
              : (item.portionLabel ?? `${item.quantityGrams}g`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  addButton: { alignItems: 'center', justifyContent: 'center' },
  macroRow: { flexDirection: 'row' },
  macroItem: { flexDirection: 'row', alignItems: 'center' },
  macroDot: {},
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  customAmountInput: { flex: 1 },
});
