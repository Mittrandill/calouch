import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { CameraTabButton } from '@/components/CameraTabButton';
import { TabBarIcon, type IconName } from '@/components/TabBarIcon';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * PRD §02 ana navigasyonu: Bugün, Günlük, AI Kamera, Antrenman, Profil.
 * Sıra sabittir ve kamera ortadadır — §00: "Ana sayfadan AI Kamera'ya en
 * fazla tek dokunuşla ulaşılır."
 */
export default function TabsLayout() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring } = useAuth();

  // Oturum diskten okunurken karar verilmez: aksi hâlde giriş yapmış kullanıcı
  // her açılışta bir an giriş ekranını görür.
  if (isRestoring) {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background.default }]}
        accessibilityLabel={t.common.loading}
      >
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand.text,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.default,
          borderTopColor: theme.colors.border.default,
        },
        tabBarLabelStyle: theme.typography.caption,
        // §02: minimum dokunma alanı 44x44.
        tabBarItemStyle: { minHeight: theme.minTouchTarget },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.today,
          tabBarIcon: (props) => <TabBarIcon {...props} name={'today' satisfies IconName} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: t.tabs.diary,
          tabBarIcon: (props) => <TabBarIcon {...props} name="diary" />,
        }}
      />

      {/* Ortadaki aksiyon: sekme değil, birincil eylem gibi görünür. */}
      <Tabs.Screen
        name="camera"
        options={{
          title: t.tabs.camera,
          tabBarLabel: () => null,
          tabBarButton: (props) => <CameraTabButton {...props} />,
          tabBarAccessibilityLabel: t.a11y.cameraAction,
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: t.tabs.training,
          tabBarIcon: (props) => <TabBarIcon {...props} name="training" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: (props) => <TabBarIcon {...props} name="profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
