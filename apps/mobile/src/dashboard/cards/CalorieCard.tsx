import { ActivityIndicator, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useDailyNutritionSummary } from '@/data/meals';
import { useProfile } from '@/data/profile';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §9 "Kalan/tüketilen kalori" — hedef `profiles.target_calories_kcal`den. */
export function CalorieCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const summary = useDailyNutritionSummary(today);
  const profile = useProfile();

  const isLoading = summary.isPending || profile.isPending;
  const consumed = summary.data?.totalEnergyKcal ?? 0;
  const target = profile.data?.target_calories_kcal ?? null;
  const remaining = target === null ? null : Math.round(target - consumed);

  return (
    <Card title={t.today.cards.calorie.title} trailing={focusBadge} size={size}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <>
          <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
            {remaining === null ? Math.round(consumed) : Math.abs(remaining)}{' '}
            <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>
              {remaining === null
                ? t.today.cards.calorie.consumed
                : remaining < 0
                  ? t.today.cards.calorie.consumed
                  : t.today.cards.calorie.remaining}
            </Text>
          </Text>

          {target === null ? (
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.text.tertiary, marginTop: theme.spacing.xs },
              ]}
            >
              {t.today.cards.calorie.noTarget}
            </Text>
          ) : (
            <View style={{ marginTop: theme.spacing.sm }}>
              <ProgressBar
                value={consumed}
                max={target}
                color={theme.colors.brand.text}
                accessibilityLabel={`${Math.round(consumed)} / ${target}`}
              />
            </View>
          )}
        </>
      )}
    </Card>
  );
}
