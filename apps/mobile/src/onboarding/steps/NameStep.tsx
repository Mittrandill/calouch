import { StyleSheet, TextInput } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/** §8.2 "Ad veya rumuz" — atlanabilir. */
export function NameStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();
  const theme = useTheme();

  return (
    <StepShell
      title={t.onboarding.name.title}
      subtitle={t.onboarding.name.subtitle}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      onSkip={onNext}
      canProceed
    >
      <TextInput
        value={draft.displayName ?? ''}
        onChangeText={(text) => updateDraft({ displayName: text })}
        placeholder={t.onboarding.name.placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={t.onboarding.name.placeholder}
        autoCapitalize="words"
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
    </StepShell>
  );
}
