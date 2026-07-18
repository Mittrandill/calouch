import type { MealDraftItem } from '@calouch/types';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FoodSearchResultRow } from '@/diary/FoodSearchResultRow';
import { useDebouncedValue } from '@/diary/useDebouncedValue';
import { useFoodSearch } from '@/data/meals';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { isWeakCatalogMatch, previewNutrients, type DraftItemState } from './mealDraftPreview';

type Props = {
  item: MealDraftItem;
  state: DraftItemState;
  onChange: (next: DraftItemState) => void;
};

/**
 * MVP-10 taslak kalemi — düzenlenebilir gram, canlı kcal/makro önizlemesi,
 * dahil et/kaldır ve (eşleşmeyen kalemler için) satır içi katalog araması.
 */
export function MealDraftItemRow({ item, state, onChange }: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [overriding, setOverriding] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const searchResults = useFoodSearch(debouncedQuery, locale);

  const nutrients = previewNutrients(item, state);
  // Kullanıcı "Değiştir" ile araması açtıysa, manuel seçim yapana kadar
  // eşleşmiş görünüm yerine arama kutusu gösterilir.
  const isMatched = (item.catalogMatch !== null && !overriding) || state.manualFood !== null;
  const showWeakMatchWarning =
    state.manualFood === null && !overriding && isWeakCatalogMatch(item);

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: theme.spacing.md,
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.lg,
          opacity: state.included ? 1 : 0.6,
        },
      ]}
    >
      <View style={[styles.headerRow, { justifyContent: 'space-between' }]}>
        <Text style={[theme.typography.label, { color: theme.colors.text.primary, flex: 1 }]}>
          {state.manualFood?.matched_name ?? item.catalogMatch?.matchedName ?? item.candidateNames.join(' / ')}
        </Text>
        {isMatched && (
          <>
            <Pressable
              onPress={() => setOverriding(true)}
              accessibilityRole="button"
              accessibilityLabel={t.camera.review.change}
              style={{ minHeight: theme.minTouchTarget, justifyContent: 'center', paddingLeft: theme.spacing.sm }}
            >
              <Text style={[theme.typography.bodySm, { color: theme.colors.brand.text }]}>
                {t.camera.review.change}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onChange({ ...state, included: !state.included })}
              accessibilityRole="button"
              accessibilityLabel={state.included ? t.camera.review.remove : t.camera.review.include}
              style={{ minHeight: theme.minTouchTarget, justifyContent: 'center', paddingLeft: theme.spacing.sm }}
            >
              <Text style={[theme.typography.bodySm, { color: theme.colors.brand.text }]}>
                {state.included ? t.camera.review.remove : t.camera.review.include}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Text
        style={[
          theme.typography.bodySm,
          { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
        ]}
      >
        {t.camera.gramRangeLabel}: {item.estimatedGrams}g ({item.minGrams}–{item.maxGrams}g)
      </Text>
      {item.cookingMethod !== null && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
          ]}
        >
          {t.camera.cookingMethodLabel}: {item.cookingMethod}
        </Text>
      )}
      <Text
        style={[theme.typography.caption, { color: theme.colors.brand.text, marginTop: theme.spacing.xs }]}
      >
        {t.camera.confidence[item.confidence]}
      </Text>

      {showWeakMatchWarning && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.warning, marginTop: theme.spacing.xs },
          ]}
        >
          {t.camera.review.weakMatchWarning}
        </Text>
      )}

      {isMatched ? (
        <>
          <TextInput
            value={state.gramsInput}
            onChangeText={(text) => onChange({ ...state, gramsInput: text.replace(/[^0-9.,]/g, '') })}
            keyboardType="decimal-pad"
            accessibilityLabel={t.diary.quantity.gramsLabel}
            editable={state.included}
            style={[
              theme.typography.numeric,
              {
                marginTop: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.background.default,
                borderColor: theme.colors.border.default,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.md,
                width: 120,
              },
            ]}
          />
          {nutrients !== null && (
            <Text
              style={[theme.typography.label, { color: theme.colors.brand.text, marginTop: theme.spacing.xs }]}
            >
              {Math.round(nutrients.energyKcal)} kcal · {Math.round(nutrients.proteinG * 10) / 10}g{' '}
              {t.camera.proteinLabel} · {Math.round(nutrients.carbsG * 10) / 10}g {t.camera.carbsLabel} ·{' '}
              {Math.round(nutrients.fatG * 10) / 10}g {t.camera.fatLabel}
            </Text>
          )}
        </>
      ) : (
        <View style={{ marginTop: theme.spacing.sm }}>
          <View style={[styles.headerRow, { justifyContent: 'space-between' }]}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.status.warning, flex: 1 }]}>
              {overriding ? t.camera.review.searchCatalogPrompt : t.camera.catalogNotMatched}
            </Text>
            {overriding && (
              <Pressable
                onPress={() => setOverriding(false)}
                accessibilityRole="button"
                accessibilityLabel={t.camera.review.discard}
                style={{ minHeight: theme.minTouchTarget, justifyContent: 'center', paddingLeft: theme.spacing.sm }}
              >
                <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
                  {t.camera.review.discard}
                </Text>
              </Pressable>
            )}
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.camera.review.searchCatalogPrompt}
            placeholderTextColor={theme.colors.text.tertiary}
            accessibilityLabel={t.camera.review.searchCatalogPrompt}
            autoCapitalize="none"
            style={[
              theme.typography.body,
              {
                marginTop: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.background.default,
                borderColor: theme.colors.border.default,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
          />
          {searchResults.isFetching && (
            <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.sm }} />
          )}
          {searchResults.data !== undefined && searchResults.data.length > 0 && (
            <View
              style={[
                styles.searchResults,
                { marginTop: theme.spacing.sm, borderRadius: theme.radius.md, borderColor: theme.colors.border.default },
              ]}
            >
              {searchResults.data.map((food) => (
                <FoodSearchResultRow
                  key={food.food_id}
                  result={food}
                  onPress={() => {
                    setOverriding(false);
                    onChange({ ...state, manualFood: food, included: true, gramsInput: String(item.estimatedGrams) });
                  }}
                />
              ))}
            </View>
          )}
          {item.catalogMatch === null && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.tertiary, marginTop: theme.spacing.xs },
              ]}
            >
              {t.camera.review.itemExcludedNotice}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  searchResults: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
