import type { ExerciseSearchResult } from '@calouch/types';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useExerciseSearch } from '@/data/exercises';
import { useProgramDetail, useSaveProgram, type SaveProgramDay } from '@/data/programs';
import { useDebouncedValue } from '@/diary/useDebouncedValue';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type DraftExercise = {
  exerciseId: string;
  name: string;
  setCount: string;
  targetReps: string;
  targetWeightKg: string;
  restSeconds: string;
};

type DraftDay = { name: string; exercises: DraftExercise[] };

/** `program_detail()` RPC'sinin `days` jsonb kolonunun beklenen şekli. */
type ProgramDetailDayJson = {
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: { targetReps: number | null; targetWeightKg: number | null; restSeconds: number | null }[];
  }[];
};

/**
 * Program oluşturma/düzenleme (TRN-02). `recipe-builder.tsx` şablonu: gün
 * ekle/çıkar, her güne egzersiz ara-ekle, egzersiz başına set sayısı +
 * hedef tekrar/ağırlık/dinlenme (v1: tüm setlere aynı hedef uygulanır —
 * set-bazında farklı hedef ve superset/dropset gruplama builder UI'sinde
 * YOK, şema hazır ama bu tur kapsamı dışı).
 */
export default function ProgramBuilderScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const { isAuthenticated, isRestoring } = useAuth();
  const { programId } = useLocalSearchParams<{ programId?: string }>();

  const existing = useProgramDetail(programId, locale);
  const saveProgram = useSaveProgram();

  const [name, setName] = useState('');
  const [days, setDays] = useState<DraftDay[]>([{ name: `${t.training.builder.dayLabel} 1`, exercises: [] }]);
  const [saveError, setSaveError] = useState<string | null>(null);
  // "You Might Not Need an Effect" deseni — bkz. recipe-builder.tsx.
  const [prefilledFor, setPrefilledFor] = useState<typeof existing.data>(undefined);

  if (existing.data !== undefined && existing.data !== prefilledFor) {
    setPrefilledFor(existing.data);
    setName(existing.data.name);
    const loadedDays = existing.data.days as unknown as ProgramDetailDayJson[];
    setDays(
      loadedDays.map((day) => ({
        name: day.name,
        exercises: day.exercises.map((exercise) => {
          const firstSet = exercise.targetSets[0];
          return {
            exerciseId: exercise.exerciseId,
            name: exercise.exerciseName,
            setCount: String(exercise.targetSets.length),
            targetReps:
              firstSet?.targetReps !== undefined && firstSet.targetReps !== null ? String(firstSet.targetReps) : '',
            targetWeightKg:
              firstSet?.targetWeightKg !== undefined && firstSet.targetWeightKg !== null
                ? String(firstSet.targetWeightKg)
                : '',
            restSeconds:
              firstSet?.restSeconds !== undefined && firstSet.restSeconds !== null
                ? String(firstSet.restSeconds)
                : '',
          };
        }),
      })),
    );
  }

  const addDay = () => {
    setDays((current) => [...current, { name: `${t.training.builder.dayLabel} ${current.length + 1}`, exercises: [] }]);
  };
  const removeDay = (dayIndex: number) => {
    setDays((current) => current.filter((_, i) => i !== dayIndex));
  };
  const updateDayName = (dayIndex: number, dayName: string) => {
    setDays((current) => current.map((d, i) => (i === dayIndex ? { ...d, name: dayName } : d)));
  };
  const addExercise = (dayIndex: number, exercise: ExerciseSearchResult) => {
    setDays((current) =>
      current.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  exerciseId: exercise.exercise_id,
                  name: exercise.matched_name,
                  setCount: '3',
                  targetReps: '10',
                  targetWeightKg: '',
                  restSeconds: '90',
                },
              ],
            }
          : d,
      ),
    );
  };
  const removeExercise = (dayIndex: number, exIndex: number) => {
    setDays((current) =>
      current.map((d, i) => (i === dayIndex ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) } : d)),
    );
  };
  const updateExerciseField = (dayIndex: number, exIndex: number, field: keyof DraftExercise, value: string) => {
    setDays((current) =>
      current.map((d, i) =>
        i === dayIndex
          ? { ...d, exercises: d.exercises.map((ex, j) => (j === exIndex ? { ...ex, [field]: value } : ex)) }
          : d,
      ),
    );
  };

  const canSave =
    name.trim().length > 0 &&
    days.length > 0 &&
    days.every(
      (d) =>
        d.name.trim().length > 0 &&
        d.exercises.length > 0 &&
        d.exercises.every((ex) => {
          const setCount = Number.parseInt(ex.setCount, 10);
          return Number.isFinite(setCount) && setCount > 0;
        }),
    );

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    try {
      const payloadDays: SaveProgramDay[] = days.map((day, dayIndex) => ({
        weekNumber: 1,
        dayIndex,
        name: day.name.trim(),
        isDeload: false,
        exercises: day.exercises.map((ex, exIndex) => {
          const setCount = Number.parseInt(ex.setCount, 10);
          const targetReps = ex.targetReps.trim() === '' ? null : Number.parseInt(ex.targetReps, 10);
          const targetWeightKg =
            ex.targetWeightKg.trim() === '' ? null : Number.parseFloat(ex.targetWeightKg.replace(',', '.'));
          const restSeconds = ex.restSeconds.trim() === '' ? null : Number.parseInt(ex.restSeconds, 10);

          return {
            exerciseId: ex.exerciseId,
            orderIndex: exIndex,
            targetSets: Array.from({ length: setCount }, (_, i) => ({
              setNumber: i + 1,
              targetReps,
              targetWeightKg,
              isWarmup: false,
              isDropset: false,
              restSeconds,
            })),
          };
        }),
      }));

      await saveProgram.mutateAsync({ programId, name: name.trim(), weeks: 1, days: payloadDays });
      router.back();
    } catch {
      setSaveError(t.training.builder.error);
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
      <Text accessibilityRole="header" style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
        {programId === undefined ? t.training.builder.titleNew : t.training.builder.titleEdit}
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t.training.builder.namePlaceholder}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={t.training.builder.nameLabel}
        style={[
          theme.typography.body,
          {
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
            marginTop: theme.spacing.lg,
          },
        ]}
      />

      {days.map((day, dayIndex) => (
        <DayEditor
          key={dayIndex}
          day={day}
          onUpdateName={(dayName) => updateDayName(dayIndex, dayName)}
          onRemoveDay={() => removeDay(dayIndex)}
          onAddExercise={(exercise) => addExercise(dayIndex, exercise)}
          onRemoveExercise={(exIndex) => removeExercise(dayIndex, exIndex)}
          onUpdateExerciseField={(exIndex, field, value) => updateExerciseField(dayIndex, exIndex, field, value)}
        />
      ))}

      <Pressable
        onPress={addDay}
        accessibilityRole="button"
        accessibilityLabel={t.training.builder.addDay}
        style={({ pressed }) => [
          styles.addDayButton,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.md,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border.default,
            backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
          },
        ]}
      >
        <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
          + {t.training.builder.addDay}
        </Text>
      </Pressable>

      {saveError !== null && (
        <Text
          accessibilityRole="alert"
          style={[theme.typography.bodySm, { color: theme.colors.status.danger, marginTop: theme.spacing.md }]}
        >
          {saveError}
        </Text>
      )}

      <Pressable
        onPress={() => void handleSave()}
        disabled={!canSave || saveProgram.isPending}
        accessibilityRole="button"
        accessibilityLabel={t.training.builder.save}
        accessibilityState={{ disabled: !canSave || saveProgram.isPending, busy: saveProgram.isPending }}
        style={({ pressed }) => [
          styles.saveButton,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.xxl,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            opacity: canSave ? 1 : 0.5,
          },
        ]}
      >
        {saveProgram.isPending ? (
          <ActivityIndicator color={theme.colors.brand.onBrand} />
        ) : (
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.training.builder.save}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

function DayEditor({
  day,
  onUpdateName,
  onRemoveDay,
  onAddExercise,
  onRemoveExercise,
  onUpdateExerciseField,
}: {
  day: DraftDay;
  onUpdateName: (name: string) => void;
  onRemoveDay: () => void;
  onAddExercise: (exercise: ExerciseSearchResult) => void;
  onRemoveExercise: (exIndex: number) => void;
  onUpdateExerciseField: (exIndex: number, field: keyof DraftExercise, value: string) => void;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const searchResults = useExerciseSearch(debouncedQuery, locale);

  return (
    <View
      style={[
        styles.dayCard,
        {
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      <View style={styles.dayHeader}>
        <TextInput
          value={day.name}
          onChangeText={onUpdateName}
          accessibilityLabel={t.training.builder.dayNameLabel}
          style={[theme.typography.label, { flex: 1, color: theme.colors.text.primary }]}
        />
        <Pressable
          onPress={onRemoveDay}
          accessibilityRole="button"
          accessibilityLabel={t.training.builder.removeDay}
          style={{
            minHeight: theme.minTouchTarget,
            minWidth: theme.minTouchTarget,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[theme.typography.body, { color: theme.colors.status.danger }]}>×</Text>
        </Pressable>
      </View>

      {day.exercises.map((exercise, exIndex) => (
        <View
          key={`${exercise.exerciseId}-${exIndex}`}
          style={{
            marginTop: theme.spacing.sm,
            paddingTop: theme.spacing.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.border.default,
          }}
        >
          <View style={styles.exerciseHeader}>
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.text.primary, flex: 1 }]}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
            <Pressable
              onPress={() => onRemoveExercise(exIndex)}
              accessibilityRole="button"
              accessibilityLabel={t.training.builder.removeExercise}
              style={{
                minHeight: theme.minTouchTarget,
                minWidth: theme.minTouchTarget,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[theme.typography.body, { color: theme.colors.status.danger }]}>×</Text>
            </Pressable>
          </View>

          <View style={[styles.exerciseFields, { marginTop: theme.spacing.xs, gap: theme.spacing.xs }]}>
            <LabeledNumberInput
              label={t.training.builder.setsLabel}
              value={exercise.setCount}
              onChangeText={(value) => onUpdateExerciseField(exIndex, 'setCount', value)}
            />
            <LabeledNumberInput
              label={t.training.builder.repsLabel}
              value={exercise.targetReps}
              onChangeText={(value) => onUpdateExerciseField(exIndex, 'targetReps', value)}
            />
            <LabeledNumberInput
              label={t.training.builder.weightLabel}
              value={exercise.targetWeightKg}
              onChangeText={(value) => onUpdateExerciseField(exIndex, 'targetWeightKg', value)}
              allowDecimal
            />
            <LabeledNumberInput
              label={t.training.builder.restLabel}
              value={exercise.restSeconds}
              onChangeText={(value) => onUpdateExerciseField(exIndex, 'restSeconds', value)}
            />
          </View>
        </View>
      ))}

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.training.builder.searchExercisePlaceholder}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={t.training.builder.addExercise}
        autoCapitalize="none"
        style={[
          theme.typography.bodySm,
          {
            marginTop: theme.spacing.sm,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border.default,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.sm,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.sm,
          },
        ]}
      />

      {searchResults.isFetching && (
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xs }} />
      )}

      {query.trim().length > 0 &&
        searchResults.data?.map((result) => (
          <Pressable
            key={result.exercise_id}
            onPress={() => {
              onAddExercise(result);
              setQuery('');
            }}
            accessibilityRole="button"
            accessibilityLabel={result.matched_name}
            style={({ pressed }) => [
              {
                minHeight: theme.minTouchTarget,
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.sm,
                backgroundColor: pressed ? theme.colors.surface.pressed : 'transparent',
              },
            ]}
          >
            <Text style={[theme.typography.bodySm, { color: theme.colors.text.primary }]}>
              {result.matched_name}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

function LabeledNumberInput({
  label,
  value,
  onChangeText,
  allowDecimal,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  allowDecimal?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[theme.typography.caption, { color: theme.colors.text.tertiary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(allowDecimal === true ? /[^0-9.,]/g : /[^0-9]/g, ''))}
        keyboardType={allowDecimal === true ? 'decimal-pad' : 'number-pad'}
        accessibilityLabel={label}
        style={[
          theme.typography.numericSm,
          {
            color: theme.colors.text.primary,
            borderColor: theme.colors.border.default,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.sm,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.xs,
            textAlign: 'center',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
  addDayButton: { alignItems: 'center', justifyContent: 'center' },
  dayCard: {},
  dayHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseFields: { flexDirection: 'row' },
});
