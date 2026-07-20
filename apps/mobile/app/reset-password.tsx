import type { AuthFailureReason } from '@calouch/analytics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { authErrorMessage } from '@/auth/authErrors';
import { Screen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Şifre sıfırlama akışının son adımı — `useAuthDeepLink.ts` PKCE kod
 * değişimini burada yönlendirir. Bilinçli olarak `(auth)` GRUBU DIŞINDA:
 * `(auth)/_layout.tsx`'in "authenticated ise (tabs)'a yönlendir" guard'ı,
 * kod değişiminin kurduğu recovery oturumunu görünce kullanıcıyı bu
 * ekrandan atardı.
 */
export default function ResetPasswordScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { session, isRestoring, updateUserPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AuthFailureReason | null>(null);

  const canSubmit = password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    const result = await updateUserPassword(password);
    if (!result.ok) {
      setError(result.reason);
      setIsSubmitting(false);
      return;
    }
    router.replace('/(tabs)');
  };

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }

  // Bağlantının süresi dolmuş/iki kez açılmış olabilir — kod değişimi
  // başarısız kaldıysa aktif bir oturum kurulmamış olur.
  if (session === null) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text
            accessibilityRole="alert"
            style={[theme.typography.body, { color: theme.colors.status.danger, textAlign: 'center' }]}
          >
            {t.auth.resetLinkExpired}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.display, { color: theme.colors.text.primary, marginBottom: theme.spacing.xl }]}
      >
        {t.auth.newPassword}
      </Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        accessibilityLabel={t.auth.newPassword}
        autoComplete="new-password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={theme.colors.text.tertiary}
        style={[
          theme.typography.body,
          {
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />

      {error !== null && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[theme.typography.bodySm, { color: theme.colors.status.danger, marginTop: theme.spacing.sm }]}
        >
          {authErrorMessage(error, t)}
        </Text>
      )}

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel={t.auth.setNewPassword}
        accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        style={({ pressed }) => [
          styles.button,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.xl,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.brand.onBrand} />
        ) : (
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.auth.setNewPassword}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { alignItems: 'center', justifyContent: 'center' },
});
