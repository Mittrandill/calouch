import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { DashboardCardId } from '@/dashboard/cardCatalog';

export type ComingSoonCardId = Exclude<
  DashboardCardId,
  'calorie' | 'macros' | 'water' | 'lastMeal' | 'measurementTrend' | 'activeEnergy' | 'steps'
>;

/**
 * Veri kaynağı henüz olmayan 4 kart için tek paylaşımlı gövde
 * (`todayWorkout`/`streak`/`challenge`/`aiInsight` — bkz. cardCatalog.ts
 * `hasRealData: false`). `activeEnergy`/`steps` MVP-12'de gerçek veriye
 * bağlandı, artık `ActiveEnergyCard`/`StepsCard` kullanır.
 *
 * Bilinçli olarak uydurma sayı YOK: gerçek kullanıcılara sahte adım/kalori
 * göstermek yerine "Yakında" rozeti + hangi işin bunu getireceğini anlatan
 * kısa açıklama gösterilir (bkz. 14-open-decisions.md).
 */
export function ComingSoonCard({
  cardId,
  size,
  focusBadge,
}: {
  cardId: ComingSoonCardId;
  size: CardSize;
  focusBadge?: ReactNode;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const card = t.today.cards[cardId];

  return (
    <Card
      title={card.title}
      size={size}
      trailing={
        <View style={[styles.trailing, { gap: theme.spacing.xs }]}>
          {focusBadge}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.status.infoSurface,
                borderRadius: theme.radius.full,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xxs,
              },
            ]}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.status.info }]}>
              {t.common.comingSoon}
            </Text>
          </View>
        </View>
      }
    >
      <Text style={[theme.typography.bodySm, { color: theme.colors.text.tertiary }]}>
        {card.description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center' },
  badge: {},
});
