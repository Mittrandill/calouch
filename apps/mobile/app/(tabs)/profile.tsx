import type { ThemePreference } from '@calouch/design-tokens';
import type { Locale } from '@calouch/localization';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme, useThemePreference } from '@/theme/ThemeProvider';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark', 'oled'];
const LOCALE_OPTIONS: Locale[] = ['tr', 'en'];

/**
 * Profil / ayarlar.
 *
 * Dalga 1A'da yalnız görünüm, dil ve çıkış barındırır. Onboarding, hedefler,
 * gizlilik merkezi ve hesap silme sonraki işlerde bağlanır (MVP-02, MVP-16/17).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { preference, setPreference } = useThemePreference();
  const { locale, setLocale } = useLocale();
  const { signOut, session } = useAuth();

  return (
    <Screen scrollable>
      <Text
        accessibilityRole="header"
        style={[theme.typography.display, { color: theme.colors.text.primary }]}
      >
        {t.tabs.profile}
      </Text>

      {session?.user.email !== undefined && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
          ]}
        >
          {session.user.email}
        </Text>
      )}

      {/* §02: tema yeniden başlatmadan değişir. */}
      <Section title={t.settings.appearance}>
        {THEME_OPTIONS.map((option) => (
          <OptionRow
            key={option}
            label={t.settings.theme[option]}
            isSelected={preference === option}
            onPress={() => setPreference(option)}
          />
        ))}
      </Section>

      <Section title={t.settings.language}>
        {LOCALE_OPTIONS.map((option) => (
          <OptionRow
            key={option}
            label={option === 'tr' ? 'Türkçe' : 'English'}
            isSelected={locale === option}
            onPress={() => setLocale(option)}
          />
        ))}
      </Section>

      <Section title={t.measurements.title}>
        <NavigationRow label={t.measurements.title} onPress={() => router.push('/measurements')} />
      </Section>

      <Section title={t.health.title}>
        <NavigationRow label={t.health.title} onPress={() => router.push('/health-connection')} />
      </Section>

      <Pressable
        onPress={() => void signOut()}
        accessibilityRole="button"
        accessibilityLabel={t.auth.signOut}
        style={({ pressed }) => [
          styles.signOut,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.xxl,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        <Text style={[theme.typography.label, { color: theme.colors.status.danger }]}>
          {t.auth.signOut}
        </Text>
      </Pressable>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: theme.spacing.xl }}>
      <Text
        accessibilityRole="header"
        style={[
          theme.typography.label,
          { color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.radius.md,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function OptionRow({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      // Seçili hâl yalnız renkle anlatılmaz: ekran okuyucu durumu okur,
      // gören kullanıcı işareti görür (§02 erişilebilirlik).
      accessibilityState={{ selected: isSelected, checked: isSelected }}
      accessibilityLabel={isSelected ? `${label}, ${t.a11y.tabSelected}` : label}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surface.pressed : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          theme.typography.body,
          { color: isSelected ? theme.colors.brand.text : theme.colors.text.primary },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <Text style={[theme.typography.body, { color: theme.colors.brand.text }]}>✓</Text>
      )}
    </Pressable>
  );
}

function NavigationRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surface.pressed : 'transparent',
        },
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>{label}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text.tertiary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signOut: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
