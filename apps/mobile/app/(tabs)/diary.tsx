import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import mealBreakfastImage from '../../assets/decorative/meal-breakfast.png';
import mealDinnerImage from '../../assets/decorative/meal-dinner.png';
import mealLunchImage from '../../assets/decorative/meal-lunch.png';
import mealSnackImage from '../../assets/decorative/meal-snack.png';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { RingGauge } from '@/components/RingGauge';
import { Screen } from '@/components/Screen';
import { WaterDropGauge } from '@/components/WaterDropGauge';
import { useDailyNutritionSummary, useTodaysMeals, type LoggedMeal, type MealType } from '@/data/meals';
import { useProfile } from '@/data/profile';
import { useSignedPhotoUrl } from '@/data/storage';
import { useDailyWaterSummary, useLogWater } from '@/data/water';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * §03 manuel öğün günlüğü — MVP-05/MVP-06.
 *
 * Tasarım dili yenilemesi (2026-07-20): Bugün ekranındaki fotoğraf kartı +
 * `RingGauge`/ProgressBar dilini buraya taşır — iki ayrı görsel sistem
 * yerine tek tutarlı dil (bkz. `Card`, `RingGauge`, `WaterDropGauge`).
 */
export default function DiaryScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const today = new Date();

  const summary = useDailyNutritionSummary(today);
  const profile = useProfile();
  const meals = useTodaysMeals(today);

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` her render'da yeni referans, gün içinde sabit kalması yeterli.
    [locale],
  );

  return (
    <Screen scrollable>
      <View>
        <Text
          accessibilityRole="header"
          style={[theme.typography.display, { color: theme.colors.text.primary }]}
        >
          {t.diary.title}
        </Text>
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xxs },
          ]}
        >
          {dateLabel}
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <NutritionHeroCard
          isLoading={summary.isPending || profile.isPending}
          totalEnergyKcal={summary.data?.totalEnergyKcal ?? null}
          totalProteinG={summary.data?.totalProteinG ?? null}
          totalCarbsG={summary.data?.totalCarbsG ?? null}
          totalFatG={summary.data?.totalFatG ?? null}
          targetEnergyKcal={profile.data?.target_calories_kcal ?? null}
          targetProteinG={profile.data?.protein_g ?? null}
          targetCarbsG={profile.data?.carbs_g ?? null}
          targetFatG={profile.data?.fat_g ?? null}
        />
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <WaterCard date={today} />
      </View>

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
        <Ionicons name="add-circle" size={20} color={theme.colors.brand.onBrand} />
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.brand.onBrand, marginLeft: theme.spacing.xs },
          ]}
        >
          {t.diary.addMeal}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/recipes')}
        accessibilityRole="button"
        accessibilityLabel={t.recipes.title}
        style={{
          minHeight: theme.minTouchTarget,
          marginTop: theme.spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="book-outline" size={16} color={theme.colors.text.secondary} />
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, marginLeft: theme.spacing.xs },
          ]}
        >
          {t.recipes.title}
        </Text>
      </Pressable>

      <View style={{ marginTop: theme.spacing.xl }}>
        {meals.isPending && <ActivityIndicator color={theme.colors.brand.text} />}

        {meals.data !== undefined && meals.data.length === 0 && <EmptyMealsState />}

        {meals.data?.map((meal) => <MealCard key={meal.id} meal={meal} />)}
      </View>
    </Screen>
  );
}

function NutritionHeroCard({
  isLoading,
  totalEnergyKcal,
  totalProteinG,
  totalCarbsG,
  totalFatG,
  targetEnergyKcal,
  targetProteinG,
  targetCarbsG,
  targetFatG,
}: {
  isLoading: boolean;
  totalEnergyKcal: number | null;
  totalProteinG: number | null;
  totalCarbsG: number | null;
  totalFatG: number | null;
  targetEnergyKcal: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
}) {
  const theme = useTheme();
  const t = useTranslations();

  const remaining =
    targetEnergyKcal === null || totalEnergyKcal === null
      ? null
      : Math.round(targetEnergyKcal - totalEnergyKcal);
  const label =
    remaining === null || remaining < 0 ? t.today.cards.calorie.consumed : t.today.cards.calorie.remaining;
  const displayValue =
    totalEnergyKcal === null ? null : remaining === null ? Math.round(totalEnergyKcal) : Math.abs(remaining);

  return (
    <Card
      title={t.today.cards.calorie.title}
      trailing={<Ionicons name="flame" size={20} color={theme.colors.brand.text} />}
      size="expanded"
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <>
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
            <RingGauge
              value={totalEnergyKcal ?? 0}
              max={targetEnergyKcal}
              size={180}
              accessibilityLabel={`${Math.round(totalEnergyKcal ?? 0)} / ${targetEnergyKcal ?? '—'} ${t.diary.calories}`}
            >
              <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
                {displayValue === null ? '—' : displayValue}
              </Text>
              <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
                {targetEnergyKcal === null ? t.diary.calories : label}
              </Text>
            </RingGauge>
          </View>

          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            <MacroRow
              label={t.today.cards.macros.protein}
              color={theme.colors.macro.protein}
              value={totalProteinG ?? 0}
              target={targetProteinG}
            />
            <MacroRow
              label={t.today.cards.macros.carbs}
              color={theme.colors.macro.carbs}
              value={totalCarbsG ?? 0}
              target={targetCarbsG}
            />
            <MacroRow
              label={t.today.cards.macros.fat}
              color={theme.colors.macro.fat}
              value={totalFatG ?? 0}
              target={targetFatG}
            />
          </View>
        </>
      )}
    </Card>
  );
}

function MacroRow({
  label,
  color,
  value,
  target,
}: {
  label: string;
  color: string;
  value: number;
  target: number | null;
}) {
  const theme = useTheme();
  return (
    <View>
      <View style={[styles.rowBetween, { marginBottom: theme.spacing.xxs }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* §02: makrolar yalnızca renkle ayrılmaz — harf/kelime etiketi taşır. */}
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
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.primary }]}>{label}</Text>
        </View>
        <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
          {Math.round(value)}
          {target !== null ? ` / ${target}` : ''}g
        </Text>
      </View>
      <ProgressBar
        value={value}
        max={target}
        color={color}
        accessibilityLabel={`${label}: ${Math.round(value)}${target !== null ? ` / ${target}` : ''}g`}
      />
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
    <Card
      title={t.diary.water.title}
      trailing={
        <WaterDropGauge
          value={consumedMl}
          max={goalMl}
          size={36}
          accessibilityLabel={`${consumedMl} / ${goalMl ?? '—'} ${t.diary.water.unit}`}
        />
      }
      size="expanded"
    >
      <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
        {consumedMl}
        <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>
          {goalMl !== null ? ` / ${goalMl}` : ''} {t.diary.water.unit}
        </Text>
      </Text>

      <View style={[styles.chipRow, { marginTop: theme.spacing.md, gap: theme.spacing.sm }]}>
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
                backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
                opacity: logWater.isPending ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[theme.typography.bodySm, { color: theme.colors.status.info }]}>+{amount}</Text>
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
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
            },
          ]}
        >
          <Ionicons name="add" size={14} color={theme.colors.text.secondary} />
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.secondary, marginLeft: theme.spacing.xxs },
            ]}
          >
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
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: theme.radius.md,
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
    </Card>
  );
}

/**
 * Öğün türüne göre dekoratif fallback — gerçek fotoğrafı olmayan (manuel
 * öğün) veya henüz yüklenmemiş kayıtlarda kullanılır (bkz. `LastMealCard`,
 * aynı desen — Bugün ekranı ile tutarlı olsun diye burada tekrarlanır).
 */
const MEAL_TYPE_FALLBACK_IMAGES: Record<MealType, ImageSourcePropType> = {
  breakfast: mealBreakfastImage,
  lunch: mealLunchImage,
  dinner: mealDinnerImage,
  snack: mealSnackImage,
  pre_workout: mealSnackImage,
  post_workout: mealSnackImage,
  night: mealSnackImage,
  custom: mealSnackImage,
};

const MEAL_TYPE_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
  pre_workout: 'barbell-outline',
  post_workout: 'barbell-outline',
  night: 'moon-outline',
  custom: 'ellipsis-horizontal-circle-outline',
};

function MealCard({ meal }: { meal: LoggedMeal }) {
  const theme = useTheme();
  const t = useTranslations();

  const signedPhoto = useSignedPhotoUrl('ai-meal-photos', meal.photoStoragePath);
  // Gerçek fotoğraf varsa onu bekle (yüklenene kadar fallback'e ATLAMA —
  // aksi hâlde fallback→gerçek foto arasında görsel flaş olur).
  const backgroundImage: ImageSourcePropType | undefined =
    signedPhoto.data !== undefined
      ? { uri: signedPhoto.data }
      : meal.photoStoragePath === null
        ? MEAL_TYPE_FALLBACK_IMAGES[meal.mealType]
        : undefined;

  const onMedia = backgroundImage !== undefined;
  const totalKcal = meal.items.reduce((sum, item) => sum + item.energyKcal, 0);
  const title = meal.mealType === 'custom' ? (meal.customLabel ?? '') : t.diary.mealTypes[meal.mealType];

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Card
        title={title}
        backgroundImage={backgroundImage}
        trailing={
          <View
            style={[
              styles.mealTypeBadge,
              {
                width: theme.spacing.xl,
                height: theme.spacing.xl,
                borderRadius: theme.radius.full,
                backgroundColor: onMedia ? 'rgba(0,0,0,0.35)' : theme.colors.surface.elevated,
              },
            ]}
          >
            <Ionicons
              name={MEAL_TYPE_ICONS[meal.mealType]}
              size={14}
              color={onMedia ? theme.colors.text.onMedia : theme.colors.text.secondary}
            />
          </View>
        }
      >
        <Text
          style={[
            theme.typography.numericSm,
            { color: onMedia ? theme.colors.text.onMedia : theme.colors.text.secondary },
          ]}
        >
          {Math.round(totalKcal)} {t.diary.calories}
        </Text>
        <View style={[styles.chipRow, { marginTop: theme.spacing.xs, gap: theme.spacing.xs }]}>
          {meal.items.map((item) => (
            <View
              key={item.id}
              style={[
                {
                  borderRadius: theme.radius.full,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xxs,
                  backgroundColor: onMedia ? 'rgba(255,255,255,0.16)' : theme.colors.surface.elevated,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: onMedia ? theme.colors.text.onMedia : theme.colors.text.secondary },
                ]}
              >
                {item.kind === 'recipe'
                  ? `${item.recipeName} × ${item.servings}`
                  : (item.portionLabel ?? `${item.quantityGrams}g`)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

function EmptyMealsState() {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <View
      style={[
        styles.emptyState,
        {
          marginTop: theme.spacing.md,
          paddingVertical: theme.spacing.xxl,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.emptyIconWrap,
          {
            width: 56,
            height: 56,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.brand.subtle,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        <Ionicons name="restaurant-outline" size={26} color={theme.colors.brand.text} />
      </View>
      <Text style={[theme.typography.body, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
        {t.diary.empty}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroDot: {},
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth },
  mealTypeBadge: { alignItems: 'center', justifyContent: 'center' },
  customAmountInput: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  emptyIconWrap: { alignItems: 'center', justifyContent: 'center' },
});
