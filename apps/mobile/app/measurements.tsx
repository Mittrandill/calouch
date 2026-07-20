import type { BodyMeasurement } from '@calouch/types';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useLogMeasurement, useMeasurements, type LogMeasurementInput } from '@/data/measurements';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type MeasurementFieldKey = Exclude<keyof LogMeasurementInput, 'measuredAt' | 'notes'>;

/**
 * §05 "her kayıtta ... boyun, omuz, göğüs, bel, kalça; sağ/sol kol, ön kol,
 * üst bacak ve baldır". Form VE geçmiş listesi aynı sıralamayı kullanır —
 * tek kaynak, iki tüketici.
 */
const MEASUREMENT_FIELDS: { key: MeasurementFieldKey; column: keyof BodyMeasurement }[] = [
  { key: 'weightKg', column: 'weight_kg' },
  { key: 'heightCm', column: 'height_cm' },
  { key: 'bodyFatPct', column: 'body_fat_pct' },
  { key: 'muscleMassKg', column: 'muscle_mass_kg' },
  { key: 'neckCm', column: 'neck_cm' },
  { key: 'shoulderCm', column: 'shoulder_cm' },
  { key: 'chestCm', column: 'chest_cm' },
  { key: 'waistCm', column: 'waist_cm' },
  { key: 'hipCm', column: 'hip_cm' },
  { key: 'armRightCm', column: 'arm_right_cm' },
  { key: 'armLeftCm', column: 'arm_left_cm' },
  { key: 'forearmRightCm', column: 'forearm_right_cm' },
  { key: 'forearmLeftCm', column: 'forearm_left_cm' },
  { key: 'thighRightCm', column: 'thigh_right_cm' },
  { key: 'thighLeftCm', column: 'thigh_left_cm' },
  { key: 'calfRightCm', column: 'calf_right_cm' },
  { key: 'calfLeftCm', column: 'calf_left_cm' },
];

const EMPTY_VALUES: Record<MeasurementFieldKey, string> = Object.fromEntries(
  MEASUREMENT_FIELDS.map((field) => [field.key, '']),
) as Record<MeasurementFieldKey, string>;

function parseField(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

/** §05 "Vücut ölçüleri" — MVP-07. */
export default function MeasurementsScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring } = useAuth();

  const measurements = useMeasurements();
  const logMeasurement = useLogMeasurement();

  const [values, setValues] = useState<Record<MeasurementFieldKey, string>>(EMPTY_VALUES);
  const [showMore, setShowMore] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = MEASUREMENT_FIELDS.some((field) => parseField(values[field.key]) !== undefined);

  const handleSave = async () => {
    if (!canSave) return;
    const input: LogMeasurementInput = {};
    for (const field of MEASUREMENT_FIELDS) {
      const parsed = parseField(values[field.key]);
      if (parsed !== undefined) input[field.key] = parsed;
    }
    setSaveError(null);
    try {
      await logMeasurement.mutateAsync(input);
      setValues(EMPTY_VALUES);
      setShowMore(false);
    } catch {
      setSaveError(t.measurements.error);
    }
  };

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.heading, { color: theme.colors.text.primary }]}
        >
          {t.measurements.title}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/progress-photos')}
        accessibilityRole="button"
        accessibilityLabel={t.measurements.photosLink}
        style={{ minHeight: theme.minTouchTarget, marginTop: theme.spacing.xs, justifyContent: 'center' }}
      >
        <Text style={[theme.typography.label, { color: theme.colors.brand.text }]}>
          {t.measurements.photosLink}
        </Text>
      </Pressable>

      <View
        style={[
          styles.card,
          {
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border.default,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <FieldInput
          fieldKey="weightKg"
          value={values.weightKg}
          onChange={(text) => setValues((current) => ({ ...current, weightKg: text }))}
        />

        <Pressable
          onPress={() => setShowMore((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={t.measurements.moreFields}
          accessibilityState={{ expanded: showMore }}
          style={{ minHeight: theme.minTouchTarget, justifyContent: 'center', marginTop: theme.spacing.sm }}
        >
          <Text style={[theme.typography.label, { color: theme.colors.text.secondary }]}>
            {showMore ? '▾ ' : '▸ '}
            {t.measurements.moreFields}
          </Text>
        </Pressable>

        {showMore &&
          MEASUREMENT_FIELDS.slice(1).map((field) => (
            <FieldInput
              key={field.key}
              fieldKey={field.key}
              value={values[field.key]}
              onChange={(text) => setValues((current) => ({ ...current, [field.key]: text }))}
            />
          ))}

        {saveError !== null && (
          <Text
            accessibilityRole="alert"
            style={[
              theme.typography.bodySm,
              { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
            ]}
          >
            {saveError}
          </Text>
        )}

        <Pressable
          onPress={() => void handleSave()}
          disabled={!canSave || logMeasurement.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.measurements.save}
          accessibilityState={{
            disabled: !canSave || logMeasurement.isPending,
            busy: logMeasurement.isPending,
          }}
          style={({ pressed }) => [
            styles.saveButton,
            {
              minHeight: theme.minTouchTarget,
              marginTop: theme.spacing.lg,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
              opacity: canSave ? 1 : 0.5,
            },
          ]}
        >
          {logMeasurement.isPending ? (
            <ActivityIndicator color={theme.colors.brand.onBrand} />
          ) : (
            <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
              {t.measurements.save}
            </Text>
          )}
        </Pressable>
      </View>

      <Text
        accessibilityRole="header"
        style={[
          theme.typography.headingSm,
          { color: theme.colors.text.primary, marginTop: theme.spacing.xxl },
        ]}
      >
        {t.measurements.weightTrend}
      </Text>

      {measurements.isPending && (
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.lg }} />
      )}

      {measurements.data !== undefined && measurements.data.length === 0 && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xl, textAlign: 'center' },
          ]}
        >
          {t.measurements.empty}
        </Text>
      )}

      {measurements.data?.map((measurement) => (
        <MeasurementRow key={measurement.id} measurement={measurement} />
      ))}
    </Screen>
  );
}

function FieldInput({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: MeasurementFieldKey;
  value: string;
  onChange: (text: string) => void;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const label = t.measurements.fields[fieldKey];

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text
        style={[
          theme.typography.label,
          { color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9.,]/g, ''))}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        style={[
          theme.typography.numeric,
          {
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.surface.elevated,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />
    </View>
  );
}

function MeasurementRow({ measurement }: { measurement: BodyMeasurement }) {
  const theme = useTheme();
  const t = useTranslations();

  const otherFields = MEASUREMENT_FIELDS.slice(1).filter((field) => measurement[field.column] !== null);

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: theme.spacing.md,
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <View style={styles.rowHeader}>
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary }]}>
          {formatDate(measurement.measured_at)}
        </Text>
        {measurement.weight_kg !== null && (
          <Text style={[theme.typography.numeric, { color: theme.colors.text.primary }]}>
            {measurement.weight_kg} kg
          </Text>
        )}
      </View>

      {otherFields.length > 0 && (
        <Text
          style={[
            theme.typography.bodySm,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xs },
          ]}
        >
          {otherFields
            .map((field) => `${t.measurements.fields[field.key]}: ${measurement[field.column]}`)
            .join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderWidth: StyleSheet.hairlineWidth },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
