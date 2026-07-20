import type { ExerciseSearchResult, FinishWorkoutSessionResult } from '@calouch/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { estimateWorkoutCalories } from '@calouch/activity-engine';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { RestTimer } from '@/components/RestTimer';
import { Screen } from '@/components/Screen';
import { useExerciseSearch } from '@/data/exercises';
import { useProfile } from '@/data/profile';
import {
  useAbandonWorkoutSession,
  useCompleteSet,
  useFinishWorkoutSession,
  useWorkoutSessionDetail,
} from '@/data/workouts';
import { useDebouncedValue } from '@/diary/useDebouncedValue';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** `workout_session_detail()` RPC'sinin `sets` jsonb kolonunun şekli. */
type WorkoutSetJson = {
  setId: string;
  exerciseId: string;
  exerciseName: string;
  reps: number | null;
  weightKg: number | null;
  isBodyweight: boolean;
  isWarmup: boolean;
};

const DEFAULT_REST_SECONDS = 90;

/**
 * Canlı antrenman (TRN-03). v1 kapsam notu: program'dan başlatılan
 * session'larda dahi bu ekran egzersizleri PROGRAMIN sırasına göre
 * dayatmaz — kullanıcı katalogdan serbestçe egzersiz seçip set kaydeder
 * (freestyle ile aynı akış). Programın hedef set/tekrar/ağırlığını canlı
 * ekranda göstermek ayrı bir veri yolu (program_day → hedefler) gerektirir;
 * bu tur kapsamı dışında bırakıldı — program-detail.tsx'te hedefler zaten
 * görülebiliyor.
 */
export default function WorkoutSessionScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const { isAuthenticated, isRestoring } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const profile = useProfile();
  const session = useWorkoutSessionDetail(sessionId, locale);
  const completeSet = useCompleteSet();
  const finishSession = useFinishWorkoutSession();
  const abandonSession = useAbandonWorkoutSession();

  const [selectedExercise, setSelectedExercise] = useState<ExerciseSearchResult | null>(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const debouncedQuery = useDebouncedValue(exerciseQuery, 300);
  const searchResults = useExerciseSearch(debouncedQuery, locale);

  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState(20);
  const [isWarmup, setIsWarmup] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [summary, setSummary] = useState<FinishWorkoutSessionResult | null>(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sets = (session.data?.sets ?? []) as unknown as WorkoutSetJson[];
  const startedAtMs = session.data !== undefined ? new Date(session.data.started_at).getTime() : null;
  const elapsedSeconds = startedAtMs !== null ? Math.max(0, Math.floor((now - startedAtMs) / 1000)) : 0;

  const liveCalories = useMemo(() => {
    if (session.data === undefined || startedAtMs === null) return null;
    return estimateWorkoutCalories({
      weightKg: profile.data?.weight_kg ?? null,
      durationHours: elapsedSeconds / 3600,
      sets: Array.from({ length: sets.length }, () => ({
        metValue: selectedExercise?.met_value ?? 4,
        isWarmup: false,
      })),
    });
  }, [session.data, startedAtMs, elapsedSeconds, sets.length, profile.data?.weight_kg, selectedExercise]);

  const handleCompleteSet = async () => {
    if (selectedExercise === null || sessionId === undefined) return;

    const setNumber = sets.filter((s) => s.exerciseId === selectedExercise.exercise_id).length + 1;
    const orderIndex = sets.length;

    await completeSet.mutateAsync({
      sessionId,
      exerciseId: selectedExercise.exercise_id,
      setNumber,
      orderIndex,
      reps,
      weightKg: selectedExercise.is_bodyweight ? null : weightKg,
      isBodyweight: selectedExercise.is_bodyweight,
      isWarmup,
    });

    if (!isWarmup) {
      setRestEndsAt(Date.now() + DEFAULT_REST_SECONDS * 1000);
    }
  };

  const handleFinish = async () => {
    if (sessionId === undefined) return;
    const result = await finishSession.mutateAsync(sessionId);
    setSummary(result);
  };

  const handleAbandon = async () => {
    if (sessionId === undefined) return;
    await abandonSession.mutateAsync(sessionId);
    router.replace('/(tabs)/training');
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

  if (summary !== null) {
    const newRecords = summary.new_personal_records as unknown as {
      exerciseName: string;
      recordType: string;
      value: number;
    }[];

    return (
      <Screen scrollable edges={{ top: true, bottom: true }}>
        <Text accessibilityRole="header" style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
          {t.training.session.summaryTitle}
        </Text>

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <SummaryRow
            label={t.training.session.summaryDuration}
            value={formatDuration(summary.duration_seconds)}
          />
          <SummaryRow
            label={t.training.session.summaryVolume}
            value={summary.total_volume_kg !== null ? `${Math.round(summary.total_volume_kg)} kg` : '—'}
          />
          <SummaryRow
            label={t.training.session.summaryCalories}
            value={summary.total_calories_kcal !== null ? `${Math.round(summary.total_calories_kcal)} kcal` : '—'}
          />
        </View>

        {newRecords.length > 0 && (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>
              {t.training.session.newRecords}
            </Text>
            {newRecords.map((record, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: theme.spacing.sm,
                }}
              >
                <Ionicons name="trophy" size={18} color={theme.colors.brand.text} />
                <Text
                  style={[theme.typography.body, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm }]}
                >
                  {record.exerciseName} — {recordTypeLabel(t, record.recordType)}: {record.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => router.replace('/(tabs)/training')}
          accessibilityRole="button"
          accessibilityLabel={t.training.session.done}
          style={({ pressed }) => [
            styles.doneButton,
            {
              minHeight: theme.minTouchTarget,
              marginTop: theme.spacing.xxl,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.training.session.done}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  if (session.isPending) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xxl }} />
      </Screen>
    );
  }

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <View style={styles.headerRow}>
        <View>
          <Text accessibilityRole="header" style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
            {session.data?.program_name ?? t.training.session.freestyleTitle}
          </Text>
          <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs }]}>
            {formatDuration(elapsedSeconds)}
            {liveCalories !== null ? ` · ~${Math.round(liveCalories)} kcal` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => void handleAbandon()}
          accessibilityRole="button"
          accessibilityLabel={t.training.session.abandon}
          style={{ minHeight: theme.minTouchTarget, justifyContent: 'center' }}
        >
          <Text style={[theme.typography.bodySm, { color: theme.colors.status.danger }]}>
            {t.training.session.abandon}
          </Text>
        </Pressable>
      </View>

      {selectedExercise === null ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text style={[theme.typography.label, { color: theme.colors.text.secondary }]}>
            {t.training.session.pickExercise}
          </Text>
          <TextInput
            value={exerciseQuery}
            onChangeText={setExerciseQuery}
            placeholder={t.training.builder.searchExercisePlaceholder}
            placeholderTextColor={theme.colors.text.tertiary}
            accessibilityLabel={t.training.session.pickExercise}
            autoCapitalize="none"
            style={[
              theme.typography.body,
              {
                marginTop: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: theme.radius.md,
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
          />
          {searchResults.isFetching && (
            <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.sm }} />
          )}
          {searchResults.data?.map((result) => (
            <Pressable
              key={result.exercise_id}
              onPress={() => {
                setSelectedExercise(result);
                setExerciseQuery('');
              }}
              accessibilityRole="button"
              accessibilityLabel={result.matched_name}
              style={({ pressed }) => [
                {
                  minHeight: theme.minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: theme.spacing.sm,
                  marginTop: theme.spacing.xxs,
                  borderRadius: theme.radius.sm,
                  backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
                },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                {result.matched_name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: theme.spacing.lg }}>
          <View style={styles.exercisePickerRow}>
            <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary, flex: 1 }]}>
              {selectedExercise.matched_name}
            </Text>
            <Pressable
              onPress={() => setSelectedExercise(null)}
              accessibilityRole="button"
              accessibilityLabel={t.training.session.changeExercise}
              style={{ minHeight: theme.minTouchTarget, justifyContent: 'center' }}
            >
              <Text style={[theme.typography.bodySm, { color: theme.colors.brand.text }]}>
                {t.training.session.changeExercise}
              </Text>
            </Pressable>
          </View>

          {sets
            .filter((s) => s.exerciseId === selectedExercise.exercise_id)
            .map((s, index) => (
              <Text
                key={s.setId}
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
                ]}
              >
                {t.training.session.setLabel} {index + 1}: {s.reps ?? '—'} × {s.weightKg ?? t.training.session.bodyweightLabel}
                {s.isWarmup ? ` (${t.training.session.warmupLabel})` : ''}
              </Text>
            ))}

          <View style={[styles.stepperRow, { marginTop: theme.spacing.lg, gap: theme.spacing.lg }]}>
            <Stepper
              label={t.training.session.repsLabel}
              value={reps}
              step={1}
              min={0}
              onChange={setReps}
            />
            {!selectedExercise.is_bodyweight && (
              <Stepper
                label={t.training.session.weightLabel}
                value={weightKg}
                step={2.5}
                min={0}
                onChange={setWeightKg}
                suffix=" kg"
              />
            )}
          </View>

          <Pressable
            onPress={() => setIsWarmup((current) => !current)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isWarmup }}
            accessibilityLabel={t.training.session.warmupLabel}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: theme.spacing.md,
              minHeight: theme.minTouchTarget,
            }}
          >
            <Ionicons
              name={isWarmup ? 'checkbox' : 'square-outline'}
              size={20}
              color={isWarmup ? theme.colors.brand.text : theme.colors.text.tertiary}
            />
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.text.secondary, marginLeft: theme.spacing.xs }]}
            >
              {t.training.session.warmupLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handleCompleteSet()}
            disabled={completeSet.isPending}
            accessibilityRole="button"
            accessibilityLabel={t.training.session.completeSet}
            style={({ pressed }) => [
              styles.completeSetButton,
              {
                minHeight: theme.minTouchTarget,
                marginTop: theme.spacing.lg,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
              },
            ]}
          >
            {completeSet.isPending ? (
              <ActivityIndicator color={theme.colors.brand.onBrand} />
            ) : (
              <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
                {t.training.session.completeSet}
              </Text>
            )}
          </Pressable>

          {restEndsAt !== null && (
            <RestTimer
              endsAt={restEndsAt}
              totalSeconds={DEFAULT_REST_SECONDS}
              onAdjust={(delta) => setRestEndsAt((current) => (current ?? Date.now()) + delta * 1000)}
              onSkip={() => setRestEndsAt(null)}
            />
          )}
        </View>
      )}

      <Pressable
        onPress={() => void handleFinish()}
        disabled={finishSession.isPending}
        accessibilityRole="button"
        accessibilityLabel={t.training.session.finish}
        style={({ pressed }) => [
          styles.finishButton,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.xxl,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border.default,
            backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
          },
        ]}
      >
        {finishSession.isPending ? (
          <ActivityIndicator color={theme.colors.brand.text} />
        ) : (
          <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
            {t.training.session.finish}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>{label}</Text>
      <Text style={[theme.typography.numeric, { color: theme.colors.text.primary }]}>{value}</Text>
    </View>
  );
}

function Stepper({
  label,
  value,
  step,
  min,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[theme.typography.caption, { color: theme.colors.text.tertiary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          accessibilityRole="button"
          accessibilityLabel={`${label} -${step}`}
          style={{
            minWidth: theme.minTouchTarget,
            minHeight: theme.minTouchTarget,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface.elevated,
          }}
        >
          <Ionicons name="remove" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text
          style={[
            theme.typography.numericDisplay,
            { color: theme.colors.text.primary, marginHorizontal: theme.spacing.md, minWidth: 72, textAlign: 'center' },
          ]}
        >
          {value}
          {suffix ?? ''}
        </Text>
        <Pressable
          onPress={() => onChange(value + step)}
          accessibilityRole="button"
          accessibilityLabel={`${label} +${step}`}
          style={{
            minWidth: theme.minTouchTarget,
            minHeight: theme.minTouchTarget,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface.elevated,
          }}
        >
          <Ionicons name="add" size={22} color={theme.colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function recordTypeLabel(t: ReturnType<typeof useTranslations>, recordType: string): string {
  switch (recordType) {
    case 'max_weight':
      return t.training.session.recordMaxWeight;
    case 'max_reps':
      return t.training.session.recordMaxReps;
    case 'max_volume':
      return t.training.session.recordMaxVolume;
    case 'estimated_1rm':
      return t.training.session.recordEstimated1RM;
    default:
      return recordType;
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exercisePickerRow: { flexDirection: 'row', alignItems: 'center' },
  stepperRow: { flexDirection: 'row', justifyContent: 'center' },
  completeSetButton: { alignItems: 'center', justifyContent: 'center' },
  finishButton: { alignItems: 'center', justifyContent: 'center' },
  doneButton: { alignItems: 'center', justifyContent: 'center' },
});
