import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  /** Sekme çubuğu olan ekranlarda alt inset'i sekme çubuğu zaten çözer. */
  edges?: { top?: boolean; bottom?: boolean };
  scrollable?: boolean;
};

/**
 * Ekranların ortak kabuğu.
 *
 * PRD §02: "Safe area, klavye ve system-bar inset'leri ortak layout'ta
 * çözülür." Her ekranın kendi inset hesabını yapması, edge-to-edge (§7.9)
 * altında Android ve iOS'ta ayrı ayrı bozulan bir yüzey üretir.
 */
export function Screen({ children, edges = { top: true }, scrollable = false }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: edges.top === true ? insets.top : 0,
    paddingBottom: edges.bottom === true ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const style = [styles.root, { backgroundColor: theme.colors.background.default }, padding];

  if (scrollable) {
    return (
      <ScrollView
        style={style}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[...style, { padding: theme.spacing.lg }]}>{children}</View>;
}

/**
 * Dalga 1A iskelet ekranı.
 *
 * Bilinçli olarak "yapım aşamasında" demez: bu ekranlar 1B/1C'de gerçek
 * içerikle değişecek ve bileşen silinecek.
 */
export function PlaceholderScreen({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.placeholder}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.heading, { color: theme.colors.text.primary }]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
