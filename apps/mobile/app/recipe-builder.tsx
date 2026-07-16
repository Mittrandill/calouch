import type { FoodSearchResult } from '@calouch/types';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
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
import { FoodSearchResultRow } from '@/diary/FoodSearchResultRow';
import { useDebouncedValue } from '@/diary/useDebouncedValue';
import { useFoodSearch } from '@/data/meals';
import { useRecipeDetail, useSaveRecipe } from '@/data/recipes';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type DraftItem = { foodId: string; name: string; quantityGrams: string };

/**
 * Tarif oluşturma/düzenleme. §03 "Kullanıcı tarif oluşturur, malzeme ve
 * gram ekler, porsiyon sayısı belirler ... öğüne ekler." "Öğüne ekleme"
 * kısmı add-meal.tsx'te; bu ekran yalnız tarifin kendisini yönetir.
 */
export default function RecipeBuilderScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const { isAuthenticated, isRestoring } = useAuth();
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();

  const existing = useRecipeDetail(recipeId);
  const saveRecipe = useSaveRecipe();

  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  // React'in "state'i render sırasında ayarla" deseni (bkz. "You Might Not
  // Need an Effect"): prefill'i useEffect içinde YAPMAZ — bir efekt içinde
  // senkron setState art arda render'a neden olur (react-hooks kuralı bunu
  // hataya çevirir). Bunun yerine, veri değiştiğinde render SIRASINDA
  // karşılaştırıp bir kerelik ayarlanır.
  const [prefilledFor, setPrefilledFor] = useState<typeof existing.data>(undefined);

  const debouncedQuery = useDebouncedValue(ingredientQuery, 300);
  const searchResults = useFoodSearch(debouncedQuery, locale);

  if (existing.data !== undefined && existing.data !== prefilledFor) {
    setPrefilledFor(existing.data);
    setName(existing.data.name);
    setServings(String(existing.data.servings));
    const loadedItems = existing.data.items as {
      id: string;
      foodId: string;
      name: string;
      quantityGrams: number;
    }[];
    setItems(
      loadedItems.map((item) => ({
        foodId: item.foodId,
        name: item.name,
        quantityGrams: String(item.quantityGrams),
      })),
    );
  }

  const addIngredient = (food: FoodSearchResult) => {
    setItems((current) => [...current, { foodId: food.food_id, name: food.matched_name, quantityGrams: '100' }]);
    setIngredientQuery('');
  };

  const removeIngredient = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const updateGrams = (index: number, grams: string) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantityGrams: grams } : item)),
    );
  };

  const servingsValue = Number.parseInt(servings, 10);
  const parsedItems = useMemo(
    () =>
      items.map((item) => ({
        foodId: item.foodId,
        quantityGrams: Number.parseFloat(item.quantityGrams.replace(',', '.')),
      })),
    [items],
  );
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(servingsValue) &&
    servingsValue > 0 &&
    parsedItems.length > 0 &&
    parsedItems.every((item) => Number.isFinite(item.quantityGrams) && item.quantityGrams > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    try {
      await saveRecipe.mutateAsync({
        recipeId,
        name: name.trim(),
        servings: servingsValue,
        items: parsedItems,
      });
      router.back();
    } catch {
      setSaveError(t.recipes.builder.error);
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

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {recipeId === undefined ? t.recipes.builder.titleNew : t.recipes.builder.titleEdit}
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t.recipes.builder.namePlaceholder}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={t.recipes.builder.nameLabel}
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

      <View style={{ marginTop: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
          ]}
        >
          {t.recipes.builder.servingsLabel}
        </Text>
        <TextInput
          value={servings}
          onChangeText={(text) => setServings(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          accessibilityLabel={t.recipes.builder.servingsLabel}
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

      <View style={{ marginTop: theme.spacing.xl }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
          ]}
        >
          {t.recipes.builder.ingredientsTitle}
        </Text>

        {items.length === 0 && (
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.tertiary }]}>
            {t.recipes.builder.emptyIngredients}
          </Text>
        )}

        {items.map((item, index) => (
          <View
            key={`${item.foodId}-${index}`}
            style={[
              styles.ingredientRow,
              {
                marginTop: theme.spacing.xs,
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border.default,
              },
            ]}
          >
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.text.primary, flex: 1 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <TextInput
              value={item.quantityGrams}
              onChangeText={(text) => updateGrams(index, text.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              accessibilityLabel={`${item.name} ${t.recipes.builder.gramsLabel}`}
              style={[
                theme.typography.numericSm,
                {
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.default,
                  borderRadius: theme.radius.sm,
                  borderWidth: StyleSheet.hairlineWidth,
                  minHeight: theme.minTouchTarget,
                  width: 64,
                  textAlign: 'right',
                  marginLeft: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.xs,
                },
              ]}
            />
            <Pressable
              onPress={() => removeIngredient(index)}
              accessibilityRole="button"
              accessibilityLabel={t.recipes.builder.removeIngredient}
              style={{
                minHeight: theme.minTouchTarget,
                minWidth: theme.minTouchTarget,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[theme.typography.body, { color: theme.colors.status.danger }]}>×</Text>
            </Pressable>
          </View>
        ))}

        <TextInput
          value={ingredientQuery}
          onChangeText={setIngredientQuery}
          placeholder={t.recipes.builder.searchPlaceholder}
          placeholderTextColor={theme.colors.text.tertiary}
          accessibilityLabel={t.recipes.builder.addIngredient}
          autoCapitalize="none"
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
              marginTop: theme.spacing.md,
            },
          ]}
        />

        {searchResults.isFetching && (
          <ActivityIndicator
            color={theme.colors.brand.text}
            style={{ marginTop: theme.spacing.sm }}
          />
        )}

        {ingredientQuery.trim().length >= 2 && (
          <FlatList
            data={searchResults.data ?? []}
            keyExtractor={(item) => item.food_id}
            scrollEnabled={false}
            style={{ marginTop: theme.spacing.sm }}
            renderItem={({ item }) => (
              <FoodSearchResultRow result={item} onPress={() => addIngredient(item)} />
            )}
          />
        )}
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
        disabled={!canSave || saveRecipe.isPending}
        accessibilityRole="button"
        accessibilityLabel={t.recipes.builder.save}
        accessibilityState={{ disabled: !canSave || saveRecipe.isPending, busy: saveRecipe.isPending }}
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
        {saveRecipe.isPending ? (
          <ActivityIndicator color={theme.colors.brand.onBrand} />
        ) : (
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.recipes.builder.save}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center' },
});
