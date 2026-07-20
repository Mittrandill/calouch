import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { useProgressPhotos } from '@/data/progressPhotos';
import { useWeightTrend } from '@/data/measurements';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * §9 "Ölçü trendi" — `weight_trend()` en yeniden eskiye sıralı döner.
 *
 * Tasarım dili yenilemesi (2026-07-20): kullanıcının en yeni ilerleme
 * fotoğrafı varsa arkaplan olarak gösterilir — bu GERÇEK kullanıcı verisi
 * olduğu için (dekoratif "yakında" kartlarının aksine) fotoğraf yoksa
 * dekoratif bir fallback YOK, kart düz kalır.
 */
export function MeasurementTrendCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();

  const trend = useWeightTrend();
  const progressPhotos = useProgressPhotos();
  const latest = trend.data?.[0];
  const previous = trend.data?.[1];
  const deltaKg = latest !== undefined && previous !== undefined ? latest.weight_kg - previous.weight_kg : null;
  const backgroundImage = progressPhotos.data?.[0]
    ? { uri: progressPhotos.data[0].signedUrl }
    : undefined;
  const textColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.primary;
  const secondaryTextColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.secondary;
  const emptyTextColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.tertiary;

  return (
    <Card
      title={t.today.cards.measurementTrend.title}
      trailing={focusBadge}
      size={size}
      backgroundImage={backgroundImage}
    >
      {trend.isPending ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : latest === undefined ? (
        <Text style={[theme.typography.bodySm, { color: emptyTextColor }]}>
          {t.today.cards.measurementTrend.empty}
        </Text>
      ) : (
        <Pressable onPress={() => router.push('/measurements')} accessibilityRole="button" accessibilityLabel={t.measurements.title}>
          <Text style={[theme.typography.bodySm, { color: secondaryTextColor }]}>
            {t.today.cards.measurementTrend.latestWeight}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: theme.spacing.xxs }}>
            <Text style={[theme.typography.numeric, { color: textColor }]}>
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
