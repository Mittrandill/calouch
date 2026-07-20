import type { AuthFailureReason } from '@calouch/analytics';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { authErrorMessage } from '@/auth/authErrors';
import { Screen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §02 "Şifre sıfırlama" — e-posta gönderme adımı. Sonraki adım (yeni şifre) `reset-password.tsx`'te. */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AuthFailureReason | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    const result = await resetPasswordForEmail(email);
    if (!result.ok) {
      setError(result.reason);
    } else {
      setSent(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.display, { color: theme.colors.text.primary, marginBottom: theme.spacing.xl }]}
      >
        {t.auth.forgotPassword}
      </Text>

      <View>
        <Text style={[theme.typography.label, { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }]}>
          {t.auth.email}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          accessibilityLabel={t.auth.email}
          autoComplete="email"
          keyboardType="email-address"
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
      </View>

      {error !== null && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[theme.typography.bodySm, { color: theme.colors.status.danger, marginTop: theme.spacing.sm }]}
        >
          {authErrorMessage(error, t)}
        </Text>
      )}

      {sent && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[theme.typography.bodySm, { color: theme.colors.status.success, marginTop: theme.spacing.sm }]}
        >
          {t.auth.resetLinkSent}
        </Text>
      )}

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel={t.auth.sendResetLink}
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
            {t.auth.sendResetLink}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
