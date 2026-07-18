import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { useTodaysMeals } from '@/data/meals';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §9 "Son öğün" — `useTodaysMeals` zaten en yeniden eskiye sıralı döner. */
export function LastMealCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const meals = useTodaysMeals(today);
  const lastMeal = meals.data?.[0];

  return (
    <Card title={t.today.cards.lastMeal.title} trailing={focusBadge} size={size}>
      {meals.isPending ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : lastMeal === undefined ? (
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.tertiary }]}>
          {t.today.cards.lastMeal.empty}
        </Text>
      ) : (
        <Pressable
          onPress={() => router.push('/(tabs)/diary')}
          accessibilityRole="button"
          accessibilityLabel={t.diary.title}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
              {lastMeal.mealType === 'custom'
                ? (lastMeal.customLabel ?? '')
                : t.diary.mealTypes[lastMeal.mealType]}
            </Text>
            <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
              {Math.round(lastMeal.items.reduce((sum, item) => sum + item.energyKcal, 0))} {t.diary.calories}
            </Text>
          </View>
        </Pressable>
      )}
    </Card>
  );
}
