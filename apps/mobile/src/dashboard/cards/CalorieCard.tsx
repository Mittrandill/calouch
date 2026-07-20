import { ActivityIndicator, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { RingGauge } from '@/components/RingGauge';
import { useDailyNutritionSummary } from '@/data/meals';
import { useProfile } from '@/data/profile';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * §9 "Kalan/tüketilen kalori" — hedef `profiles.target_calories_kcal`den.
 * Görsel dil kararı (2026-07-19): Bugün ekranının tek "imza" metriği,
 * `RingGauge` ile gösterilir (logodaki halka motifinin ekran içi karşılığı).
 */
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
  const label =
    remaining === null || remaining < 0 ? t.today.cards.calorie.consumed : t.today.cards.calorie.remaining;
  const displayValue = remaining === null ? Math.round(consumed) : Math.abs(remaining);

  return (
    <Card title={t.today.cards.calorie.title} trailing={focusBadge} size={size}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : target === null ? (
        <>
          <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
            {Math.round(consumed)}
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.tertiary, marginTop: theme.spacing.xs },
            ]}
          >
            {t.today.cards.calorie.noTarget}
          </Text>
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
          <RingGauge
            value={consumed}
            max={target}
            size={size === 'expanded' ? 200 : 160}
            accessibilityLabel={`${Math.round(consumed)} / ${target} ${t.diary.calories}`}
          >
            <Text style={[theme.typography.numericDisplay, { color: theme.colors.text.primary }]}>
              {displayValue}
            </Text>
            <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>{label}</Text>
          </RingGauge>
        </View>
      )}
    </Card>
  );
}
