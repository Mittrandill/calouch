import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { CardSize } from '@/components/Card';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import type { DashboardCardDefinition } from './cardCatalog';
import { CalorieCard } from './cards/CalorieCard';
import { ComingSoonCard, type ComingSoonCardId } from './cards/ComingSoonCard';
import { LastMealCard } from './cards/LastMealCard';
import { MacroCard } from './cards/MacroCard';
import { MeasurementTrendCard } from './cards/MeasurementTrendCard';
import { WaterCard } from './cards/WaterCard';

/**
 * Kart id'sini doğru gövdeye yönlendiren dispatcher. Odak kartı rozeti
 * (§9 "günlük odak kartı") burada tek yerden üretilir — her kart bileşeni
 * kendi `trailing` alanına ekler.
 */
export function DashboardCard({
  card,
  size,
  isFocused,
}: {
  card: DashboardCardDefinition;
  size: CardSize;
  isFocused: boolean;
}) {
  const theme = useTheme();
  const t = useTranslations();

  const focusBadge: ReactNode | undefined = isFocused ? (
    <View
      style={{
        backgroundColor: theme.colors.brand.subtle,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
      }}
    >
      <Text style={[theme.typography.caption, { color: theme.colors.brand.text }]}>
        {t.today.focusBadge}
      </Text>
    </View>
  ) : undefined;

  switch (card.id) {
    case 'calorie':
      return <CalorieCard size={size} focusBadge={focusBadge} />;
    case 'macros':
      return <MacroCard size={size} focusBadge={focusBadge} />;
    case 'water':
      return <WaterCard size={size} focusBadge={focusBadge} />;
    case 'lastMeal':
      return <LastMealCard size={size} focusBadge={focusBadge} />;
    case 'measurementTrend':
      return <MeasurementTrendCard size={size} focusBadge={focusBadge} />;
    default:
      return <ComingSoonCard cardId={card.id as ComingSoonCardId} size={size} focusBadge={focusBadge} />;
  }
}
