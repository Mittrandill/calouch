import { cmToFeetInches, feetInchesToCm } from '@calouch/nutrition-engine';
import { useState } from 'react';
import { View } from 'react-native';

import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { NumericField } from '../components/NumericField';
import { StepShell } from '../components/StepShell';
import type { StepProps } from './StepProps';

/**
 * §8.2 "Boy". Depolama her zaman cm; emperyal seçiliyken kullanıcı ft/in
 * girer, iki alan `feetInchesToCm` ile tek `heightCm` değerine birleşir.
 */
export function HeightStep({ draft, updateDraft, onNext, onBack, currentIndex, totalSteps }: StepProps) {
  const t = useTranslations();
  const theme = useTheme();
  const isImperial = draft.unitSystem === 'imperial';

  // Emperyal alt-alanlar yerel state'te tutulur: ft/in ayrı ayrı yazılırken
  // her tuşta cm'e çevirip geri ft/in'e çevirmek (yuvarlama nedeniyle) yazan
  // rakamı kullanıcının gözü önünde değiştirebilirdi.
  const initialSplit = draft.heightCm !== undefined ? cmToFeetInches(draft.heightCm) : null;
  const [feet, setFeet] = useState(initialSplit?.feet.toString() ?? '');
  const [inches, setInches] = useState(initialSplit?.inches.toString() ?? '');

  const canProceed =
    draft.heightCm !== undefined && draft.heightCm >= 80 && draft.heightCm <= 260;

  const handleImperialChange = (nextFeet: string, nextInches: string) => {
    setFeet(nextFeet);
    setInches(nextInches);
    const f = Number.parseInt(nextFeet, 10);
    const i = Number.parseInt(nextInches, 10);
    if (!Number.isNaN(f) && !Number.isNaN(i)) {
      updateDraft({ heightCm: feetInchesToCm(f, i) });
    } else {
      updateDraft({ heightCm: undefined });
    }
  };

  return (
    <StepShell
      title={t.onboarding.height.title}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      {isImperial ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <NumericField
              placeholder={t.onboarding.height.placeholderFeet}
              value={feet}
              onChangeText={(text) => handleImperialChange(text, inches)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <NumericField
              placeholder={t.onboarding.height.placeholderInches}
              value={inches}
              onChangeText={(text) => handleImperialChange(feet, text)}
            />
          </View>
        </View>
      ) : (
        <NumericField
          placeholder={t.onboarding.height.placeholderCm}
          value={draft.heightCm?.toString() ?? ''}
          onChangeText={(text) => {
            const cm = Number.parseFloat(text.replace(',', '.'));
            updateDraft({ heightCm: Number.isNaN(cm) ? undefined : cm });
          }}
        />
      )}
    </StepShell>
  );
}
