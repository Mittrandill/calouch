import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  currentIndex: number;
  totalSteps: number;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canProceed: boolean;
  isSaving?: boolean;
  nextLabel?: string;
};

/**
 * Onboarding adımlarının ortak kabuğu: ilerleme, başlık, içerik, alt
 * navigasyon. §02: "Safe area, klavye ve system-bar inset'leri ortak
 * layout'ta çözülür" — Screen bileşeni üzerinden miras alınır.
 */
export function StepShell({
  title,
  subtitle,
  children,
  currentIndex,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  canProceed,
  isSaving = false,
  nextLabel,
}: Props) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <View style={styles.header}>
        {onBack !== undefined ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.back}
            style={{ minHeight: theme.minTouchTarget, justifyContent: 'center' }}
          >
            <Text style={[theme.typography.label, { color: theme.colors.text.secondary }]}>
              {'‹ '}
              {t.onboarding.back}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        {/* Kategorik sayı çifti; ayrı çeviri gerektirmez. */}
        <Text
          accessibilityLabel={`${currentIndex + 1} / ${totalSteps}`}
          style={[theme.typography.caption, { color: theme.colors.text.tertiary }]}
        >
          {currentIndex + 1} / {totalSteps}
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.heading, { color: theme.colors.text.primary }]}
        >
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>{children}</View>

      <View style={{ marginTop: theme.spacing.xxl }}>
        <Pressable
          onPress={onNext}
          disabled={!canProceed || isSaving}
          accessibilityRole="button"
          accessibilityLabel={nextLabel ?? t.onboarding.next}
          accessibilityState={{ disabled: !canProceed || isSaving, busy: isSaving }}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
              opacity: canProceed ? 1 : 0.5,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.brand.onBrand} />
          ) : (
            <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
              {nextLabel ?? t.onboarding.next}
            </Text>
          )}
        </Pressable>

        {onSkip !== undefined && (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.skip}
            style={{
              minHeight: theme.minTouchTarget,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: theme.spacing.sm,
            }}
          >
            <Text style={[theme.typography.label, { color: theme.colors.text.tertiary }]}>
              {t.onboarding.skip}
            </Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButton: { alignItems: 'center', justifyContent: 'center' },
});
