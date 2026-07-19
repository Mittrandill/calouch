import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { useDailyActivitySummary } from '@/data/dailyActivity';
import { useHealthConnection } from '@/health/HealthConnectionProvider';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §9/§17 "Aktif enerji" — bağlı değilse uydurma sayı yerine "Bağlan" CTA'sı gösterir. */
export function ActiveEnergyCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const health = useHealthConnection();
  const summary = useDailyActivitySummary(today);

  const isConnected = health.status === 'connected';

  return (
    <Card title={t.today.cards.activeEnergy.title} trailing={focusBadge} size={size}>
      {!isConnected ? (
        <Pressable
          onPress={() => router.push('/health-connection')}
          accessibilityRole="button"
          accessibilityLabel={t.today.cards.activeEnergy.connectPrompt}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.brand.text }]}>
            {t.today.cards.activeEnergy.connectPrompt}
          </Text>
        </Pressable>
      ) : summary.isPending ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <Text style={[theme.typography.numeric, { color: theme.colors.text.primary }]}>
          {summary.data?.activeEnergyKcal ?? '—'} kcal
        </Text>
      )}
    </Card>
  );
}
