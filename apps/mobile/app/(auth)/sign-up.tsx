import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AuthForm } from '@/components/AuthForm';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUpScreen() {
  const t = useTranslations();
  const theme = useTheme();
  const { signUp } = useAuth();

  return (
    <AuthForm
      title={t.auth.signUpTitle}
      submitLabel={t.auth.signUp}
      onSubmit={signUp}
      // E-posta doğrulaması açıkken signUp oturum açmaz; kullanıcı ne
      // olduğunu bilmeli, yoksa ekran "hiçbir şey olmadı" gibi görünür.
      successNote={t.auth.checkEmail}
      footer={
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
          {t.auth.hasAccount}{' '}
          <Link href="/(auth)/sign-in" style={{ color: theme.colors.brand.text }}>
            {t.auth.signIn}
          </Link>
        </Text>
      }
    />
  );
}
