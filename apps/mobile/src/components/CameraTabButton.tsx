import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type AccessibilityState, type GestureResponderEvent } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * `tabBarButton`'ın verdiği prop'ların ihtiyaç duyduğumuz alt kümesi.
 *
 * @react-navigation/bottom-tabs'tan tip almak yerine burada tanımlanır:
 * o paket expo-router'ın geçişli bağımlılığıdır, bizim doğrudan
 * bağımlılığımız değil — ona tip için bağlanmak, expo-router'ın iç
 * detayını sözleşmeye çevirirdi.
 */
type CameraTabButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
};

/**
 * Ortadaki AI Kamera aksiyonu.
 *
 * PRD §02: "Ortadaki kamera aksiyonu görsel olarak ayrışır."
 * PRD §00: fotoğraf merkezli deneyim — bu, sekme çubuğundaki diğer dört
 * öğeyle eşit ağırlıkta bir sekme değil, ürünün birincil eylemidir.
 */
export function CameraTabButton({
  onPress,
  accessibilityLabel,
  accessibilityState,
}: CameraTabButtonProps) {
  const theme = useTheme();
  const isSelected = accessibilityState?.selected === true;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.circle,
            theme.shadows.md,
            {
              backgroundColor:
                pressed || isSelected ? theme.colors.brand.pressed : theme.colors.brand.default,
              shadowColor: theme.shadows.md.shadowColor,
            },
          ]}
        >
          <Ionicons name="scan" size={26} color={theme.colors.brand.onBrand} />
        </View>
      )}
    </Pressable>
  );
}

const CIRCLE_SIZE = 56;

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    // Tam yuvarlak: tokens.radius.full ile aynı sonucu verir, ancak boyuta
    // bağlı olduğu için burada türetilir.
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
