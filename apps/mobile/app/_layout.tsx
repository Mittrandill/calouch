import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Kök yerleşim.
 *
 * Sağlayıcı sırası önemli: Theme ve Locale en dışta, çünkü hata ekranı ve
 * yükleme durumu bile temalı ve çevrilmiş olmalı. Auth onların içinde.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <ErrorBoundary>
            <AuthProvider>
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
              </Stack>
            </AuthProvider>
          </ErrorBoundary>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Durum çubuğu ikonları arka planla birlikte değişmeli, yoksa okunmaz. */
function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.isDark ? 'light' : 'dark'} />;
}
