import type { FavoriteFoodSummary, FoodSearchResult } from '@calouch/types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  // search_foods ve list_favorite_foods aynı gösterim alanlarını taşır —
  // bu satır iki farklı RPC dönüşünü tek bileşende kullanabilmek için.
  result: Pick<FoodSearchResult | FavoriteFoodSummary, 'food_id' | 'matched_name' | 'brand_name' | 'energy_kcal'>;
  onPress: () => void;
  /** §03 favori besin — verilmezse yıldız gösterilmez (ör. tarif malzeme aramasında). */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

/**
 * NOT: satırın kendisi (onPress) ve favori yıldızı (onToggleFavorite) İKİ
 * AYRI, KARDEŞ Pressable — biri diğerinin içinde DEĞİL. react-native-web
 * accessibilityRole="button" olan Pressable'ı gerçek bir <button> DOM
 * elemanına çevirir; bir <button> başka bir <button>'ı iç içe barındıramaz
 * (geçersiz HTML — React bunu hydration hatası olarak loglar ve tıklama
 * olayları web'de dış <button>'a kadar kabarcıklanabilir/bloklanabilir).
 */
export function FoodSearchResultRow({ result, onPress, isFavorite, onToggleFavorite }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.surface.default,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.default,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={result.matched_name}
        style={({ pressed }) => [
          styles.pressableRow,
          {
            paddingVertical: theme.spacing.sm,
            backgroundColor: pressed ? theme.colors.surface.pressed : 'transparent',
          },
        ]}
      >
        <View style={styles.textColumn}>
          <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
            {result.matched_name}
          </Text>
          {result.brand_name !== null && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.tertiary, marginTop: theme.spacing.xxs },
              ]}
            >
              {result.brand_name}
            </Text>
          )}
        </View>
        <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
          {Math.round(result.energy_kcal)} kcal
        </Text>
      </Pressable>
      {onToggleFavorite !== undefined && (
        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite === true }}
          accessibilityLabel={isFavorite === true ? '★' : '☆'}
          style={{
            minHeight: theme.minTouchTarget,
            minWidth: theme.minTouchTarget,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={[
              theme.typography.body,
              { color: isFavorite === true ? theme.colors.status.warning : theme.colors.text.tertiary },
            ]}
          >
            {isFavorite === true ? '★' : '☆'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  pressableRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textColumn: { flex: 1 },
});
