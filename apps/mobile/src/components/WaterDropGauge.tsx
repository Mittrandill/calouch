import { useEffect, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const DROP_PATH = 'M12 2C12 2 4 12.4 4 16.2C4 20.5 7.6 24 12 24C16.4 24 20 20.5 20 16.2C20 12.4 12 2 12 2Z';

type WaterDropGaugeProps = {
  value: number;
  max: number | null;
  size?: number;
  color?: string;
  accessibilityLabel: string;
};

/**
 * Su kartının imza motifi — `RingGauge`'ın (kalori) yanında suya özgü ikinci
 * bir "canlı" SVG motif (tasarım dili yenilemesi, 2026-07-20): damla şeklinde
 * dolum, aynı animasyon deseniyle (`Animated.Value`, web'de statik fallback).
 */
export function WaterDropGauge({ value, max, size = 40, color, accessibilityLabel }: WaterDropGaugeProps) {
  const theme = useTheme();
  const fillColor = color ?? theme.colors.status.info;
  const ratio = max === null || max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

  const [animatedRatio] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(animatedRatio, {
      toValue: ratio,
      duration: 600,
      useNativeDriver: false, // y/height native driver'da desteklenmez
    }).start();
  }, [ratio, animatedRatio]);

  const fillY = animatedRatio.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const fillHeight = animatedRatio.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={max === null ? undefined : { min: 0, max, now: Math.round(value) }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <ClipPath id="waterDropClip">
            <Path d={DROP_PATH} />
          </ClipPath>
        </Defs>
        <Path d={DROP_PATH} fill={theme.colors.surface.elevated} />
        {Platform.OS === 'web' ? (
          // RingGauge'daki web istisnasıyla aynı sebep: react-native-web'in
          // Animated bileşenlere eklediği collapsable prop'u SVG'de sızıyor.
          <Rect
            x={0}
            y={24 - 24 * ratio}
            width={24}
            height={24 * ratio}
            fill={fillColor}
            clipPath="url(#waterDropClip)"
          />
        ) : (
          <AnimatedRect x={0} y={fillY} width={24} height={fillHeight} fill={fillColor} clipPath="url(#waterDropClip)" />
        )}
      </Svg>
    </View>
  );
}
