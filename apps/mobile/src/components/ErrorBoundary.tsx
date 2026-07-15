import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { reportError } from '@/observability/reportError';
import { useTheme } from '@/theme/ThemeProvider';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Render hatasında beyaz ekran yerine kurtarılabilir bir yüzey gösterir.
 *
 * Kullanıcıya hata metni GÖSTERİLMEZ: mesaj teknik, İngilizce olabilir ve
 * §09 gereği kullanıcı verisi içerebilir. Ayrıntı yalnız crash sağlayıcısına
 * gider.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  private readonly reset = () => this.setState({ hasError: false });

  override render() {
    if (this.state.hasError) {
      return <ErrorScreen onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      accessibilityRole="alert"
    >
      <Text
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
        accessibilityRole="header"
      >
        {t.common.error}
      </Text>

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t.common.retry}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.xl,
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.lg,
          },
        ]}
      >
        <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
          {t.common.retry}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { alignItems: 'center', justifyContent: 'center' },
});
