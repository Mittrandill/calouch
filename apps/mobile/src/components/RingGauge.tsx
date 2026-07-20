import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingGaugeProps = {
  value: number;
  max: number | null;
  size?: number;
  strokeWidth?: number;
  color?: string;
  accessibilityLabel: string;
  /** Halkanın ortasına yerleşir — genelde büyük bir sayaç. */
  children?: ReactNode;
};

/**
 * Dairesel ilerleme göstergesi — marka logosundaki halka/gauge motifinin
 * ekran içi karşılığı (görsel dil kararı, 2026-07-19). `ProgressBar`'ın
 * (düz çubuk) YERİNE değil YANINDA durur — Bugün ekranındaki tek büyük
 * "imza" metrik (kalori) için kullanılır, her küçük kart için değil.
 */
export function RingGauge({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  color,
  accessibilityLabel,
  children,
}: RingGaugeProps) {
  const theme = useTheme();
  const ringColor = color ?? theme.colors.brand.text;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max === null || max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

  // useRef(...).current yerine lazy state: yeni React Compiler lint kuralı
  // render sırasında ref.current okumasını yasaklıyor, state okuması serbest.
  const [animatedRatio] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(animatedRatio, {
      toValue: ratio,
      duration: 600,
      useNativeDriver: false, // strokeDashoffset native driver'da desteklenmez
    }).start();
  }, [ratio, animatedRatio]);

  const strokeDashoffset = animatedRatio.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={max === null ? undefined : { min: 0, max, now: Math.round(value) }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surface.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {Platform.OS === 'web' ? (
          // react-native-web'in Animated bileşenlere zorla eklediği collapsable prop'u
          // react-native-svg'nin web Circle'ında DOM'a sızıp React uyarısı üretiyor;
          // web yalnız yerel geliştirme önizlemesi olduğundan animasyonu atlıyoruz.
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        ) : (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        )}
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}
