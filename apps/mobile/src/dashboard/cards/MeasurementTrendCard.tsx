import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { useWeightTrend } from '@/data/measurements';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §9 "Ölçü trendi" — `weight_trend()` en yeniden eskiye sıralı döner. */
export function MeasurementTrendCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();

  const trend = useWeightTrend();
  const latest = trend.data?.[0];
  const previous = trend.data?.[1];
  const deltaKg = latest !== undefined && previous !== undefined ? latest.weight_kg - previous.weight_kg : null;

  return (
    <Card title={t.today.cards.measurementTrend.title} trailing={focusBadge} size={size}>
      {trend.isPending ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : latest === undefined ? (
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.tertiary }]}>
          {t.today.cards.measurementTrend.empty}
        </Text>
      ) : (
        <Pressable onPress={() => router.push('/measurements')} accessibilityRole="button" accessibilityLabel={t.measurements.title}>
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
            {t.today.cards.measurementTrend.latestWeight}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: theme.spacing.xxs }}>
            <Text style={[theme.typography.numeric, { color: theme.colors.text.primary }]}>
              {latest.weight_kg} kg
            </Text>
            {deltaKg !== null && deltaKg !== 0 && (
              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    marginLeft: theme.spacing.sm,
                    color: deltaKg < 0 ? theme.colors.status.success : theme.colors.status.warning,
                  },
                ]}
              >
                {deltaKg > 0 ? '+' : ''}
                {deltaKg.toFixed(1)} kg
              </Text>
            )}
          </View>
        </Pressable>
      )}
    </Card>
  );
}
