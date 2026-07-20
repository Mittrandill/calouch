import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useCopyProgram, useProgramDetail } from '@/data/programs';
import { useStartWorkoutSession } from '@/data/workouts';
import { useLocale, useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** `program_detail()` RPC'sinin `days` jsonb kolonunun beklenen şekli. */
type ProgramDetailDayJson = {
  dayId: string;
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: { targetReps: number | null; restSeconds: number | null }[];
  }[];
};

/**
 * Program detayı (TRN-02) — hem kendi hem şablon programları için tek
 * salt-okunur ekran. Sahibiyse Düzenle + Başlat; şablonsa Kopyala + Başlat.
 */
export default function ProgramDetailScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { locale } = useLocale();
  const { isAuthenticated, isRestoring } = useAuth();
  const { programId } = useLocalSearchParams<{ programId?: string }>();

  const program = useProgramDetail(programId, locale);
  const copyProgram = useCopyProgram();
  const startSession = useStartWorkoutSession();

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

  if (program.isPending) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xxl }} />
      </Screen>
    );
  }

  if (program.data === undefined) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.tertiary, textAlign: 'center', marginTop: theme.spacing.xxl },
          ]}
        >
          {t.training.detail.notFound}
        </Text>
      </Screen>
    );
  }

  const data = program.data;
  const days = data.days as unknown as ProgramDetailDayJson[];

  const handleStart = async () => {
    const sessionId = await startSession.mutateAsync({ programVersionId: data.program_version_id });
    router.push({ pathname: '/workout-session', params: { sessionId } });
  };

  const handleCopy = async () => {
    const newProgramId = await copyProgram.mutateAsync(data.program_id);
    router.replace({ pathname: '/program-builder', params: { programId: newProgramId } });
  };

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text accessibilityRole="header" style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
        {data.name}
      </Text>

      <View style={[styles.actionRow, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={() => void handleStart()}
          disabled={startSession.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.training.detail.start}
          style={({ pressed }) => [
            styles.actionButton,
            styles.flexHalf,
            {
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.training.detail.start}
          </Text>
        </Pressable>

        {data.is_own ? (
          <Pressable
            onPress={() => router.push({ pathname: '/program-builder', params: { programId: data.program_id } })}
            accessibilityRole="button"
            accessibilityLabel={t.training.detail.edit}
            style={({ pressed }) => [
              styles.actionButton,
              styles.flexHalf,
              {
                minHeight: theme.minTouchTarget,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border.default,
                backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
              {t.training.detail.edit}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void handleCopy()}
            disabled={copyProgram.isPending}
            accessibilityRole="button"
            accessibilityLabel={t.training.detail.copy}
            style={({ pressed }) => [
              styles.actionButton,
              styles.flexHalf,
              {
                minHeight: theme.minTouchTarget,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border.default,
                backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
              {t.training.detail.copy}
            </Text>
          </Pressable>
        )}
      </View>

      {days.map((day) => (
        <View key={day.dayId} style={{ marginTop: theme.spacing.xl }}>
          <Text style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}>{day.name}</Text>
          {day.exercises.map((exercise) => (
            <View
              key={exercise.exerciseId}
              style={{
                marginTop: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border.default,
              }}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                {exercise.exerciseName}
              </Text>
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
                ]}
              >
                {exercise.targetSets.length} × {exercise.targetSets[0]?.targetReps ?? '—'} {t.training.detail.repsLabel}
                {exercise.targetSets[0]?.restSeconds !== undefined && exercise.targetSets[0].restSeconds !== null
                  ? ` · ${exercise.targetSets[0].restSeconds}s ${t.training.detail.restLabel}`
                  : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row' },
  actionButton: { alignItems: 'center', justifyContent: 'center' },
  flexHalf: { flex: 1 },
});
