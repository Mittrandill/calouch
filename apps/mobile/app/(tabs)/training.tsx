import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { usePrograms } from '@/data/programs';
import { useActiveWorkoutSession, useStartWorkoutSession } from '@/data/workouts';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Antrenman ana ekranı (TRN-01/02/03, Faz 2). Diary tab'ının
 * kendi-içinde-her-şey stiliyle tutarlı: aktif session banner'ı, serbest
 * antrenman/program oluşturma aksiyonları, programlarım + hazır programlar.
 */
export default function TrainingScreen() {
  const theme = useTheme();
  const t = useTranslations();

  const activeSession = useActiveWorkoutSession();
  const programs = usePrograms();
  const startSession = useStartWorkoutSession();

  const myPrograms = programs.data?.filter((p) => !p.is_template) ?? [];
  const templatePrograms = programs.data?.filter((p) => p.is_template) ?? [];
  const activeSessionData = activeSession.data;
  const hasActiveSession = activeSessionData !== undefined && activeSessionData !== null;

  const startFreestyle = async () => {
    const sessionId = await startSession.mutateAsync({});
    router.push({ pathname: '/workout-session', params: { sessionId } });
  };

  return (
    <Screen scrollable>
      <Text
        accessibilityRole="header"
        style={[theme.typography.display, { color: theme.colors.text.primary }]}
      >
        {t.tabs.training}
      </Text>

      {activeSessionData !== undefined && activeSessionData !== null && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Card title={t.training.home.activeSessionTitle}>
            <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
              {activeSessionData.program_name ?? t.training.home.freestyleLabel}
              {activeSessionData.day_name !== null ? ` — ${activeSessionData.day_name}` : ''}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/workout-session',
                  params: { sessionId: activeSessionData.session_id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={t.training.home.continueSession}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  minHeight: theme.minTouchTarget,
                  marginTop: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
                },
              ]}
            >
              <Ionicons name="play" size={18} color={theme.colors.brand.onBrand} />
              <Text
                style={[
                  theme.typography.label,
                  { color: theme.colors.brand.onBrand, marginLeft: theme.spacing.xs },
                ]}
              >
                {t.training.home.continueSession}
              </Text>
            </Pressable>
          </Card>
        </View>
      )}

      <View style={[styles.actionRow, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={() => void startFreestyle()}
          disabled={startSession.isPending || hasActiveSession}
          accessibilityRole="button"
          accessibilityLabel={t.training.home.startFreestyle}
          style={({ pressed }) => [
            styles.actionButton,
            styles.flexHalf,
            {
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border.default,
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              opacity: hasActiveSession ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons name="flash-outline" size={18} color={theme.colors.text.primary} />
          <Text
            style={[theme.typography.label, { color: theme.colors.text.primary, marginLeft: theme.spacing.xs }]}
          >
            {t.training.home.startFreestyle}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/program-builder')}
          accessibilityRole="button"
          accessibilityLabel={t.training.home.createProgram}
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
          <Ionicons name="add-circle" size={18} color={theme.colors.brand.onBrand} />
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.brand.onBrand, marginLeft: theme.spacing.xs },
            ]}
          >
            {t.training.home.createProgram}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Text style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
          {t.training.home.myPrograms}
        </Text>

        {programs.isPending && <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.md }} />}

        {programs.data !== undefined && myPrograms.length === 0 && (
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.tertiary, marginTop: theme.spacing.sm },
            ]}
          >
            {t.training.home.myProgramsEmpty}
          </Text>
        )}

        {myPrograms.map((program) => (
          <ProgramRow key={program.program_id} program={program} />
        ))}
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Text style={[theme.typography.heading, { color: theme.colors.text.primary }]}>
          {t.training.home.readyPrograms}
        </Text>

        {templatePrograms.map((program) => (
          <ProgramRow key={program.program_id} program={program} />
        ))}
      </View>
    </Screen>
  );
}

function ProgramRow({
  program,
}: {
  program: { program_id: string; name: string; weeks: number; day_count: number };
}) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/program-detail', params: { programId: program.program_id } })}
      accessibilityRole="button"
      accessibilityLabel={program.name}
      style={({ pressed }) => [
        styles.programRow,
        {
          minHeight: theme.minTouchTarget,
          marginTop: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border.default,
          backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
        },
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>{program.name}</Text>
      <Text style={[theme.typography.bodySm, { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs }]}>
        {program.day_count} {t.training.home.dayLabel}
        {program.weeks > 1 ? ` · ${program.weeks} ${t.training.home.weeksLabel}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row' },
  flexHalf: { flex: 1 },
  programRow: {},
});
