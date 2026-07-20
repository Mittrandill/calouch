import { ActivityIndicator, Text, View } from 'react-native';

import waterImage from '../../../assets/decorative/water.png';
import { Card, type CardSize } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useProfile } from '@/data/profile';
import { useDailyWaterSummary } from '@/data/water';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * §9 "Su" — özet gösterir. Tek dokunuşla ekleme `diary.tsx`'in `WaterCard`
 * bileşeninde zaten var; burada tekrarlanmıyor (kapsam: Bugün ekranı bir
 * özet kartı, günlük ekranı asıl kayıt yeri).
 *
 * Tasarım dili yenilemesi (2026-07-20): temalı arkaplan görseli her zaman
 * gösterilir — bu gerçek veri kartı, "yakında" değil.
 */
export function WaterCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const profile = useProfile();
  const summary = useDailyWaterSummary(today);
  const isLoading = profile.isPending || summary.isPending;

  const goalMl = profile.data?.water_ml ?? null;
  const consumedMl = summary.data?.totalMl ?? 0;

  return (
    <Card
      title={t.today.cards.water.title}
      trailing={focusBadge}
      size={size}
      backgroundImage={waterImage}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <>
          <Text style={[theme.typography.numeric, { color: theme.colors.text.onMedia }]}>
            {consumedMl}
            {goalMl !== null ? ` / ${goalMl}` : ''} ml
          </Text>
          <View style={{ marginTop: theme.spacing.sm }}>
            <ProgressBar
              value={consumedMl}
              max={goalMl}
              color={theme.colors.status.info}
              accessibilityLabel={`${consumedMl} / ${goalMl ?? '—'} ml`}
            />
          </View>
        </>
      )}
    </Card>
  );
}
