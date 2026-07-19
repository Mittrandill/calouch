import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { DashboardCard } from '@/dashboard/DashboardCard';
import { useDashboardLayout } from '@/dashboard/useDashboardLayout';
import { useHealthConnection } from '@/health/HealthConnectionProvider';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Bugün ekranı (§9, MVP-11). Kart kataloğu, sıralama/görünürlük/boyut/odak
 * kartı tercihi `useDashboardLayout()` üzerinden `profiles.dashboard_layout`
 * ile senkron.
 */
export default function TodayScreen() {
  const theme = useTheme();
  const t = useTranslations();

  const { isLoading, isError, isOffline, visibleOrderedCards, focusCard, layout } = useDashboardLayout();

  // §17/MVP-12: HealthKit/Health Connect'e bağlıysa ekran açılınca senkron
  // yapar — arka plan senkronu bilinçli olarak yok (§01 native kapı, bkz.
  // 14-open-decisions.md).
  const { status: healthStatus, syncToday: syncHealthToday } = useHealthConnection();
  useEffect(() => {
    if (healthStatus === 'connected') {
      void syncHealthToday();
    }
  }, [healthStatus, syncHealthToday]);

  const remainingCards = visibleOrderedCards.filter((card) => card.id !== focusCard?.id);

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.display, { color: theme.colors.text.primary }]}
        >
          {t.today.title}
        </Text>
        <Pressable
          onPress={() => router.push('/manage-dashboard-cards')}
          accessibilityRole="button"
          accessibilityLabel={t.today.manageCards}
          style={{
            minWidth: theme.minTouchTarget,
            minHeight: theme.minTouchTarget,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="options-outline" size={24} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {isOffline && (
        <View
          style={[
            styles.banner,
            {
              marginTop: theme.spacing.sm,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.status.infoSurface,
              padding: theme.spacing.md,
            },
          ]}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.status.info }]}>
            {t.common.offline}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ marginTop: theme.spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.brand.text} />
        </View>
      ) : isError && !isOffline ? (
        <View style={{ marginTop: theme.spacing.xxl, alignItems: 'center' }}>
          <Text
            accessibilityRole="alert"
            style={[theme.typography.body, { color: theme.colors.status.danger, textAlign: 'center' }]}
          >
            {t.today.errorBanner}
          </Text>
        </View>
      ) : visibleOrderedCards.length === 0 ? (
        <Pressable
          onPress={() => router.push('/manage-dashboard-cards')}
          accessibilityRole="button"
          style={{ marginTop: theme.spacing.xxl, alignItems: 'center' }}
        >
          <Text style={[theme.typography.body, { color: theme.colors.text.tertiary, textAlign: 'center' }]}>
            {t.today.allCardsHidden}
          </Text>
        </Pressable>
      ) : (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          {focusCard !== undefined && (
            <DashboardCard
              card={focusCard}
              size={focusCard.supportedSizes.includes('expanded') ? 'expanded' : focusCard.defaultSize}
              isFocused
            />
          )}
          {remainingCards.map((card) => (
            <DashboardCard
              key={card.id}
              card={card}
              size={layout.cardSizes[card.id] ?? card.defaultSize}
              isFocused={false}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  banner: {},
});
