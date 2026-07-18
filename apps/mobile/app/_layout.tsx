import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { asyncStoragePersister, queryClient } from '@/data/queryClient';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Kök yerleşim.
 *
 * Sağlayıcı sırası önemli: Theme ve Locale en dışta, çünkü hata ekranı ve
 * yükleme durumu bile temalı ve çevrilmiş olmalı. QueryClientProvider,
 * AuthProvider'ı sarar — useProfile gibi hook'lar hem oturuma hem query
 * client'a erişir.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <ErrorBoundary>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{
                persister: asyncStoragePersister,
                // §09 sağlık verisi ilkesiyle tutarlı: diskte süresiz kalmaz.
                maxAge: 24 * 60 * 60 * 1000,
              }}
            >
              <AuthProvider>
                <ThemedStatusBar />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="add-meal" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="recipes" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="recipe-builder" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="measurements" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="progress-photos" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="manage-dashboard-cards" options={{ presentation: 'modal' }} />
                </Stack>
              </AuthProvider>
            </PersistQueryClientProvider>
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
