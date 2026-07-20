import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AuthForm } from '@/components/AuthForm';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignInScreen() {
  const t = useTranslations();
  const theme = useTheme();
  const { signIn } = useAuth();

  return (
    <AuthForm
      title={t.auth.signInTitle}
      submitLabel={t.auth.signIn}
      onSubmit={signIn}
      footer={
        <>
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
            {t.auth.noAccount}{' '}
            <Link href="/(auth)/sign-up" style={{ color: theme.colors.brand.text }}>
              {t.auth.signUp}
            </Link>
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
            ]}
          >
            <Link href="/(auth)/forgot-password" style={{ color: theme.colors.brand.text }}>
              {t.auth.forgotPassword}
            </Link>
          </Text>
        </>
      }
    />
  );
}
