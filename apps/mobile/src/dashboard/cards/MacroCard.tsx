import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card, type CardSize } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useDailyNutritionSummary } from '@/data/meals';
import { useProfile } from '@/data/profile';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §9 "Protein, karbonhidrat ve yağ ilerlemesi." */
export function MacroCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const summary = useDailyNutritionSummary(today);
  const profile = useProfile();
  const isLoading = summary.isPending || profile.isPending;

  return (
    <Card title={t.today.cards.macros.title} trailing={focusBadge} size={size}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <MacroRow
            label={t.today.cards.macros.protein}
            color={theme.colors.macro.protein}
            value={summary.data?.totalProteinG ?? 0}
            target={profile.data?.protein_g ?? null}
          />
          <MacroRow
            label={t.today.cards.macros.carbs}
            color={theme.colors.macro.carbs}
            value={summary.data?.totalCarbsG ?? 0}
            target={profile.data?.carbs_g ?? null}
          />
          <MacroRow
            label={t.today.cards.macros.fat}
            color={theme.colors.macro.fat}
            value={summary.data?.totalFatG ?? 0}
            target={profile.data?.fat_g ?? null}
          />
        </View>
      )}
    </Card>
  );
}

function MacroRow({
  label,
  color,
  value,
  target,
}: {
  label: string;
  color: string;
  value: number;
  target: number | null;
}) {
  const theme = useTheme();

  return (
    <View>
      <View style={[styles.row, { marginBottom: theme.spacing.xxs }]}>
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.primary }]}>{label}</Text>
        <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
          {Math.round(value)}
          {target !== null ? ` / ${target}` : ''}g
        </Text>
      </View>
      <ProgressBar
        value={value}
        max={target}
        color={color}
        accessibilityLabel={`${label}: ${Math.round(value)}${target !== null ? ` / ${target}` : ''}g`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
