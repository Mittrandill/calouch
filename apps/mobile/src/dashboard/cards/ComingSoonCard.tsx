import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import challengeImage from '../../../assets/decorative/challenge-plank.png';
import streakImage from '../../../assets/decorative/streak-running.png';
import workoutImage from '../../../assets/decorative/workout-chest.png';
import { Card, type CardSize } from '@/components/Card';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { DashboardCardId } from '@/dashboard/cardCatalog';

export type ComingSoonCardId = Exclude<
  DashboardCardId,
  'calorie' | 'macros' | 'water' | 'lastMeal' | 'measurementTrend' | 'activeEnergy' | 'steps'
>;

/**
 * Dekoratif önizleme görselleri (tasarım dili yenilemesi, 2026-07-20).
 * `aiInsight` BİLİNÇLİ OLARAK yok — rastgele bir antrenman/challenge
 * fotoğrafının "AI değerlendirmesi" kartında görünmesi tutarsız olurdu.
 */
const COMING_SOON_IMAGES: Partial<Record<ComingSoonCardId, ImageSourcePropType>> = {
  todayWorkout: workoutImage,
  streak: streakImage,
  challenge: challengeImage,
};

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
  const backgroundImage = COMING_SOON_IMAGES[cardId];
  const descriptionColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.tertiary;

  return (
    <Card
      title={card.title}
      size={size}
      backgroundImage={backgroundImage}
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
      <Text style={[theme.typography.bodySm, { color: descriptionColor }]}>
        {card.description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center' },
  badge: {},
});
