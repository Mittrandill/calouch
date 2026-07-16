import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
};

/**
 * Ondalıklı sayı girişi. RN'in `numeric` klavyesi bazı Android
 * sürümlerinde nokta/virgül tuşu vermeyebilir; `decimal-pad` her iki
 * platformda da ondalık ayırıcıyı gösterir.
 */
export function NumericField({ label, placeholder, value, onChangeText, suffix }: Props) {
  const theme = useTheme();

  return (
    <View>
      {label !== undefined && (
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9.,]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="decimal-pad"
          accessibilityLabel={label ?? placeholder}
          style={[
            styles.input,
            theme.typography.numeric,
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
        {suffix !== undefined && (
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.tertiary, marginLeft: theme.spacing.sm },
            ]}
          >
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1 },
});
