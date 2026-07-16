import type { FoodSearchResult, RecipeSummary } from '@calouch/types';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { OptionList, type Option } from '@/onboarding/components/OptionList';
import { FoodSearchResultRow } from '@/diary/FoodSearchResultRow';
import { useDebouncedValue } from '@/diary/useDebouncedValue';
import { useFavoriteFoods, useToggleFavorite } from '@/data/favorites';
import { useFoodDetail, useFoodSearch, useLogMeal, type MealType } from '@/data/meals';
import { useRecipes } from '@/data/recipes';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** Saatin gününe göre akla yatkın bir varsayılan öğün türü. */
function defaultMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  if (hour < 22) return 'dinner';
  return 'night';
}

/**
 * Öğün ekleme akışı: ara -> seç -> miktar/öğün türü -> kaydet.
 *
 * §03 "Öğün oluşturma yöntemleri": bu dalgada yalnız besin arama (§03'teki
 * barkod/etiket/fotoğraf/tarif yöntemleri sonraki işlerin kapsamı).
 */
export default function AddMealScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const { isAuthenticated, isRestoring } = useAuth();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [grams, setGrams] = useState('100');
  const [recipeServings, setRecipeServings] = useState('1');
  const [mealType, setMealType] = useState<MealType>(defaultMealTypeForNow);
  const [saveError, setSaveError] = useState<string | null>(null);

  const searchResults = useFoodSearch(debouncedQuery, locale);
  const foodDetail = useFoodDetail(selectedFood?.food_id);
  const recipes = useRecipes();
  const favorites = useFavoriteFoods(locale);
  const toggleFavorite = useToggleFavorite();
  const logMeal = useLogMeal();

  const favoriteFoodIds = useMemo(
    () => new Set(favorites.data?.map((food) => food.food_id) ?? []),
    [favorites.data],
  );

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

  const gramsValue = Number.parseFloat(grams.replace(',', '.'));
  const recipeServingsValue = Number.parseFloat(recipeServings.replace(',', '.'));
  const canSave =
    (selectedFood !== null && Number.isFinite(gramsValue) && gramsValue > 0) ||
    (selectedRecipe !== null && Number.isFinite(recipeServingsValue) && recipeServingsValue > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    try {
      await logMeal.mutateAsync({
        mealType,
        loggedAt: new Date(),
        items:
          selectedRecipe !== null
            ? [{ kind: 'recipe', recipeId: selectedRecipe.recipe_id, servings: recipeServingsValue }]
            : [{ kind: 'food', foodId: selectedFood!.food_id, quantityGrams: gramsValue }],
      });
      router.back();
    } catch {
      setSaveError(t.diary.error.save);
    }
  };

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // ---------------------------------------------------------------------
  // Adım 2: miktar/porsiyon + öğün türü
  // ---------------------------------------------------------------------
  if (selectedFood !== null || selectedRecipe !== null) {
    return (
      <Screen scrollable edges={{ top: true, bottom: true }}>
        <Pressable
          onPress={() => {
            setSelectedFood(null);
            setSelectedRecipe(null);
          }}
          accessibilityRole="button"
          accessibilityLabel={t.onboarding.back}
          style={{ minHeight: theme.minTouchTarget, justifyContent: 'center' }}
        >
          <Text style={[theme.typography.label, { color: theme.colors.text.secondary }]}>
            {'‹ '}
            {t.onboarding.back}
          </Text>
        </Pressable>

        <Text
          accessibilityRole="header"
          style={[
            theme.typography.heading,
            { color: theme.colors.text.primary, marginTop: theme.spacing.lg },
          ]}
        >
          {selectedFood?.matched_name ?? selectedRecipe?.name}
        </Text>

        {selectedFood !== null ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
              ]}
            >
              {t.diary.quantity.gramsLabel}
            </Text>
            <TextInput
              value={grams}
              onChangeText={(text) => setGrams(text.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              accessibilityLabel={t.diary.quantity.gramsLabel}
              style={[
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

            {/* §03 porsiyonlar: hızlı seçim. */}
            {foodDetail.data !== undefined && foodDetail.data.portions !== null && (
              <View
                style={[
                  styles.portionRow,
                  { marginTop: theme.spacing.sm, gap: theme.spacing.sm },
                ]}
              >
                {(foodDetail.data.portions as { label: string; grams: number }[]).map((portion) => (
                  <Pressable
                    key={portion.label}
                    onPress={() => setGrams(String(portion.grams))}
                    accessibilityRole="button"
                    accessibilityLabel={portion.label}
                    style={({ pressed }) => [
                      styles.portionChip,
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
                    <Text style={[theme.typography.bodySm, { color: theme.colors.text.primary }]}>
                      {portion.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
              ]}
            >
              {t.diary.fromRecipe.servingsQuestion}
            </Text>
            <TextInput
              value={recipeServings}
              onChangeText={(text) => setRecipeServings(text.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              accessibilityLabel={t.diary.fromRecipe.servingsQuestion}
              style={[
                theme.typography.numeric,
                {
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  minHeight: theme.minTouchTarget,
                  paddingHorizontal: theme.spacing.md,
                  width: 96,
                },
              ]}
            />
          </View>
        )}

        <View style={{ marginTop: theme.spacing.xl }}>
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
            ]}
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
          accessibilityLabel={t.diary.quantity.save}
          accessibilityState={{ disabled: !canSave || logMeal.isPending, busy: logMeal.isPending }}
          style={({ pressed }) => [
            styles.saveButton,
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
              {t.diary.quantity.save}
            </Text>
          )}
        </Pressable>
      </Screen>
    );
  }

  // ---------------------------------------------------------------------
  // Adım 1: arama
  // ---------------------------------------------------------------------
  return (
    <Screen edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {t.diary.search.title}
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.diary.search.placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={t.diary.search.placeholder}
        autoCapitalize="none"
        autoFocus
        style={[
          theme.typography.body,
          {
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
            marginTop: theme.spacing.lg,
          },
        ]}
      />

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.sm },
          ]}
        >
          {t.diary.search.hint}
        </Text>
      )}

      {/* §03 "tarif ... öğüne eklenir" — arama boşken tarif listesi
          önerilir, sonuçları gölgelemez. */}
      {query.trim().length === 0 && recipes.data !== undefined && recipes.data.length > 0 && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
            ]}
          >
            {t.recipes.title}
          </Text>
          {recipes.data.map((recipe) => (
            <Pressable
              key={recipe.recipe_id}
              onPress={() => setSelectedRecipe(recipe)}
              accessibilityRole="button"
              accessibilityLabel={recipe.name}
              style={({ pressed }) => [
                styles.recipeRow,
                {
                  minHeight: theme.minTouchTarget,
                  paddingVertical: theme.spacing.sm,
                  backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border.default,
                },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                {recipe.name}
              </Text>
              <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
                {recipe.per_serving_energy_kcal === null ? '—' : Math.round(recipe.per_serving_energy_kcal)}{' '}
                kcal {t.recipes.perServing}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* §03 "son/sık kullanılan" — arama boşken favoriler önerilir. */}
      {query.trim().length === 0 && favorites.data !== undefined && favorites.data.length > 0 && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
            ]}
          >
            {t.diary.favorites.title}
          </Text>
          {favorites.data.map((food) => (
            <FoodSearchResultRow
              key={food.food_id}
              result={food}
              onPress={() =>
                setSelectedFood({
                  food_id: food.food_id,
                  matched_name: food.matched_name,
                  matched_locale: locale,
                  match_score: 1,
                  category: food.category,
                  brand_name: food.brand_name,
                  energy_kcal: food.energy_kcal,
                  protein_g: food.protein_g,
                  carbs_g: food.carbs_g,
                  fat_g: food.fat_g,
                  is_custom: food.is_custom,
                })
              }
              isFavorite
              onToggleFavorite={() => toggleFavorite.mutate({ foodId: food.food_id, isFavorite: true })}
            />
          ))}
        </View>
      )}

      {searchResults.isFetching && (
        <ActivityIndicator
          color={theme.colors.brand.text}
          style={{ marginTop: theme.spacing.lg }}
        />
      )}

      {searchResults.data !== undefined && searchResults.data.length === 0 && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xl, textAlign: 'center' },
          ]}
        >
          {t.diary.search.empty}
        </Text>
      )}

      <FlatList
        data={searchResults.data ?? []}
        keyExtractor={(item) => item.food_id}
        style={{ marginTop: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <FoodSearchResultRow
            result={item}
            onPress={() => setSelectedFood(item)}
            isFavorite={favoriteFoodIds.has(item.food_id)}
            onToggleFavorite={() =>
              toggleFavorite.mutate({ foodId: item.food_id, isFavorite: favoriteFoodIds.has(item.food_id) })
            }
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
  recipeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  portionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  portionChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
