import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type Option<T extends string> = { value: T; label: string; hint?: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/**
 * Tek seçimli liste. §02: "Seçili hâl yalnız renkle anlatılmaz" — işaret
 * hem renk hem ✓ karakteri taşır, `accessibilityState` ekran okuyucuya
 * durumu ayrıca bildirir.
 */
export function OptionList<T extends string>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, checked: isSelected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.row,
              {
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                backgroundColor: pressed ? theme.colors.surface.pressed : 'transparent',
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border.default,
              },
            ]}
          >
            <View style={styles.textColumn}>
              <Text
                style={[
                  theme.typography.body,
                  { color: isSelected ? theme.colors.brand.text : theme.colors.text.primary },
                ]}
              >
                {option.label}
              </Text>
              {option.hint !== undefined && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.text.tertiary, marginTop: theme.spacing.xxs },
                  ]}
                >
                  {option.hint}
                </Text>
              )}
            </View>
            {isSelected && (
              <Text style={[theme.typography.body, { color: theme.colors.brand.text }]}>✓</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textColumn: { flex: 1 },
});
