import { Redirect } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useHealthConnection } from '@/health/HealthConnectionProvider';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

const ERROR_KEY = {
  'not-available': 'notAvailable',
  'connect-failed': 'connectFailed',
  'sync-failed': 'syncFailed',
} as const;

/**
 * §17'nin 6 adımlı bağlanma akışı: fayda açıklaması → "Bağla" → OS izin
 * ekranı → durum gösterimi → yönetim (bağlantıyı kes). Onboarding'de
 * İSTENMEZ (§00 "Health iznini onboarding engeline dönüştürmek" yasak) —
 * yalnız profilden buraya, kullanıcı isteğiyle gelinir.
 */
export default function HealthConnectionScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring: authRestoring } = useAuth();
  const health = useHealthConnection();

  if (authRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const statusLabel =
    health.status === 'connected'
      ? t.health.statusConnected
      : health.status === 'connecting'
        ? t.health.connecting
        : health.status === 'denied'
          ? t.health.statusDenied
          : t.health.statusDisconnected;

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {t.health.title}
      </Text>

      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
        ]}
      >
        {t.health.intro}
      </Text>

      <View
        style={[
          styles.card,
          {
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border.default,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.statusRow}>
          <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>
            {statusLabel}
          </Text>
          {health.isRestoring && <ActivityIndicator size="small" color={theme.colors.brand.text} />}
        </View>

        {!health.isSupported ? (
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.tertiary, marginTop: theme.spacing.sm },
            ]}
          >
            {t.health.webUnsupported}
          </Text>
        ) : health.status === 'connected' ? (
          <Pressable
            onPress={() => void health.disconnect()}
            accessibilityRole="button"
            accessibilityLabel={t.health.disconnect}
            style={({ pressed }) => [
              styles.button,
              {
                marginTop: theme.spacing.md,
                minHeight: theme.minTouchTarget,
                borderRadius: theme.radius.md,
                borderColor: theme.colors.border.default,
                backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.status.danger }]}>
              {t.health.disconnect}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void health.connect()}
            disabled={health.status === 'connecting'}
            accessibilityRole="button"
            accessibilityLabel={Platform.OS === 'ios' ? t.health.connectApple : t.health.connectAndroid}
            style={({ pressed }) => [
              styles.button,
              {
                marginTop: theme.spacing.md,
                minHeight: theme.minTouchTarget,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
                opacity: health.status === 'connecting' ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
              {Platform.OS === 'ios' ? t.health.connectApple : t.health.connectAndroid}
            </Text>
          </Pressable>
        )}

        {health.error !== null && (
          <Text
            accessibilityRole="alert"
            style={[
              theme.typography.bodySm,
              { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
            ]}
          >
            {t.health.errors[ERROR_KEY[health.error]]}
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
