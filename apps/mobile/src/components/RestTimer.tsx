import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type RestTimerProps = {
  /** Mutlak bitiş zaman damgası (epoch ms) — PRD §06 "Mutlak `ends_at`
   * zamanı kullanır; yalnızca memory decrement'e dayanmaz." Kalan süre her
   * tick'te `endsAt - Date.now()` ile YENİDEN hesaplanır, bu yüzden arka
   * plan/kilit ekranında JS timer'ların throttle edilmesi sonucu etkilemez. */
  endsAt: number;
  /** Sayacın başlangıç uzunluğu (sn) — ilerleme çubuğunun `max`'ı. */
  totalSeconds: number;
  onAdjust: (deltaSeconds: number) => void;
  onSkip: () => void;
  /** Süre dolduğunda bir kez çağrılır (titreşimle birlikte). */
  onComplete?: () => void;
};

/**
 * Dinlenme sayacı (§06). +15/−15/atla desteklenir. Titreşim her zaman açık
 * v1'de — "tercihe bağlı" ayar toggle'ı bu turun kapsamı dışı.
 */
export function RestTimer({ endsAt, totalSeconds, onAdjust, onSkip, onComplete }: RestTimerProps) {
  const theme = useTheme();
  const t = useTranslations();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = Math.max(0, endsAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isDone = remainingMs <= 0;

  useEffect(() => {
    if (isDone) {
      Vibration.vibrate(400);
      onComplete?.();
    }
    // onComplete kasıtlı olarak dep değil — yalnız isDone'ın false->true
    // geçişinde BİR KEZ tetiklenmeli, her render'da yeniden çağrılmamalı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const label = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <View
      style={{
        marginTop: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface.default,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
        alignItems: 'center',
      }}
    >
      <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
        {t.training.rest.title}
      </Text>
      <Text
        style={[theme.typography.display, { color: theme.colors.text.primary, marginTop: theme.spacing.xs }]}
        accessibilityLiveRegion="polite"
      >
        {label}
      </Text>

      <View style={{ width: '100%', marginTop: theme.spacing.md }}>
        <ProgressBar
          value={remainingSeconds}
          max={totalSeconds}
          color={theme.colors.status.info}
          accessibilityLabel={`${t.training.rest.title}: ${label}`}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <Pressable
          onPress={() => onAdjust(-15)}
          accessibilityRole="button"
          accessibilityLabel="-15 saniye"
          style={({ pressed }) => [
            {
              minHeight: theme.minTouchTarget,
              minWidth: theme.minTouchTarget,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.elevated,
            },
          ]}
        >
          <Ionicons name="remove" size={20} color={theme.colors.text.primary} />
        </Pressable>

        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={t.training.rest.skip}
          style={({ pressed }) => [
            {
              minHeight: theme.minTouchTarget,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {isDone ? t.training.rest.continueLabel : t.training.rest.skip}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onAdjust(15)}
          accessibilityRole="button"
          accessibilityLabel="+15 saniye"
          style={({ pressed }) => [
            {
              minHeight: theme.minTouchTarget,
              minWidth: theme.minTouchTarget,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.elevated,
            },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}
