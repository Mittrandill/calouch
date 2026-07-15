import type { AuthFailureReason } from '@calouch/analytics';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authErrorMessage } from '@/auth/authErrors';
import { Screen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  title: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<{ ok: boolean; reason?: AuthFailureReason }>;
  footer: React.ReactNode;
  /** Kayıt sonrası e-posta doğrulaması beklenirken gösterilir. */
  successNote?: string;
};

export function AuthForm({ title, submitLabel, onSubmit, footer, successNote }: Props) {
  const theme = useTheme();
  const t = useTranslations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AuthFailureReason | null>(null);
  const [showSuccessNote, setShowSuccessNote] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    setShowSuccessNote(false);

    const result = await onSubmit(email, password);

    // Başarılıysa yönlendirmeyi AuthProvider/Redirect yapar; burada state
    // güncellemek unmount sonrası uyarı üretebilir, o yüzden yalnız hata yolu.
    if (!result.ok) {
      setError(result.reason ?? 'unknown');
    } else if (successNote !== undefined) {
      setShowSuccessNote(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <KeyboardAvoidingView
        // §02: klavye inset'i ortak layout'ta çözülür.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Text
          accessibilityRole="header"
          style={[
            theme.typography.display,
            { color: theme.colors.text.primary, marginBottom: theme.spacing.xl },
          ]}
        >
          {title}
        </Text>

        <Field
          label={t.auth.email}
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          keyboardType="email-address"
        />
        <Field
          label={t.auth.password}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          secureTextEntry
        />

        {error !== null && (
          <Text
            // Ekran okuyucu hatayı odak değişmeden duyurmalı.
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              theme.typography.bodySm,
              { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
            ]}
          >
            {authErrorMessage(error, t)}
          </Text>
        )}

        {showSuccessNote && successNote !== undefined && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              theme.typography.bodySm,
              { color: theme.colors.status.success, marginTop: theme.spacing.sm },
            ]}
          >
            {successNote}
          </Text>
        )}

        <Pressable
          onPress={() => void handleSubmit()}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
          style={({ pressed }) => [
            styles.primaryButton,
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
              {submitLabel}
            </Text>
          )}
        </Pressable>

        {/*
          Google / Apple / magic link: MVP-01'in kalan işinde bağlanır.
          Bilinçli olarak `disabled`: sessizce hiçbir şey yapmayan bir butondan
          dürüst. Apple ile giriş, §02 gereği platform kuralı istediğinde
          görünür olmak zorunda — yer şimdiden ayrıldı.
        */}
        <View style={{ marginTop: theme.spacing.xl }}>
          <ProviderButton label={t.auth.continueWithGoogle} />
          {Platform.OS === 'ios' && <ProviderButton label={t.auth.continueWithApple} />}
          <ProviderButton label={t.auth.magicLink} />
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>{footer}</View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();

  return (
    <View style={{ marginTop: theme.spacing.lg }}>
      <Text
        style={[
          theme.typography.label,
          { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
        ]}
      >
        {label}
      </Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
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
  );
}

function ProviderButton({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={label}
      style={[
        styles.providerButton,
        {
          minHeight: theme.minTouchTarget,
          marginTop: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border.default,
          opacity: 0.4,
        },
      ]}
    >
      <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  primaryButton: { alignItems: 'center', justifyContent: 'center' },
  providerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
