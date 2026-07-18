import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type ProgressBarProps = {
  /** Mevcut değer. `max` 0 veya null ise bar boş gösterilir. */
  value: number;
  max: number | null;
  color: string;
  /** Ekran okuyucu için — ör. "1400 / 2200 kalori". */
  accessibilityLabel: string;
};

/**
 * Düz `View` tabanlı ilerleme çubuğu (MVP-11).
 *
 * react-native-svg kurulu değil (bkz. 14-open-decisions.md) — bu yüzden ring
 * yerine genişlik yüzdesiyle çalışan düz bir bar kullanılır, mevcut
 * View/Text stiliyle tutarlı.
 */
export function ProgressBar({ value, max, color, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const ratio = max === null || max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={max === null ? undefined : { min: 0, max, now: Math.round(value) }}
      style={[
        styles.track,
        {
          height: theme.spacing.xs,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${ratio * 100}%`,
            borderRadius: theme.radius.full,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
