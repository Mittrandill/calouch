import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/auth/AuthProvider';
import { useAuthDeepLink } from '@/auth/useAuthDeepLink';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { asyncStoragePersister, queryClient } from '@/data/queryClient';
import { HealthConnectionProvider } from '@/health/HealthConnectionProvider';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export { ErrorBoundary } from '@/components/ErrorBoundary';

// Fontlar yüklenene kadar splash ekranı açık kalır — Space Grotesk/Inter
// yerine bir an sistem fontu görünüp sonra değişmesin (görsel "zıplama").
void SplashScreen.preventAutoHideAsync();

/**
 * Kök yerleşim.
 *
 * Sağlayıcı sırası önemli: Theme ve Locale en dışta, çünkü hata ekranı ve
 * yükleme durumu bile temalı ve çevrilmiş olmalı. QueryClientProvider,
 * AuthProvider'ı sarar — useProfile gibi hook'lar hem oturuma hem query
 * client'a erişir.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // fontError'da da devam edilir — yazı tipi eksikliği uygulamayı asla
  // kilitlemez (§00 "temel kullanım çalışır"), sistem fontuna düşer.
  if (!fontsLoaded && !fontError) return null;

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
                <HealthConnectionProvider>
                  <ThemedStatusBar />
                  <AuthDeepLinkListener />
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
                    <Stack.Screen name="health-connection" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="reset-password" options={{ presentation: 'modal' }} />
                  </Stack>
                </HealthConnectionProvider>
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

/** Magic link/şifre sıfırlama derin bağlantılarını dinler — bkz. useAuthDeepLink.ts. */
function AuthDeepLinkListener() {
  useAuthDeepLink();
  return null;
}
