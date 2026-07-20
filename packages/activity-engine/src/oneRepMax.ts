/**
 * Tahmini tek tekrar maksimumu (1RM) — Epley formülü.
 *
 * 1RM ≈ ağırlık × (1 + tekrar / 30)
 *
 * `finish_workout_session()` SQL fonksiyonundaki `estimated_1rm` PR
 * hesabıyla AYNI formül — orası otoriter/atomik kaynak (bkz.
 * supabase/migrations/20260720162500_workout_functions.sql), burası
 * formülün test edilebilir/dokümante edilmiş TS aynası + canlı ekranda
 * anlık önizleme için kullanılır.
 */
export function estimateOneRepMax(input: { weightKg: number; reps: number }): number {
  if (input.weightKg <= 0 || input.reps <= 0) return 0;
  return Math.round(input.weightKg * (1 + input.reps / 30) * 100) / 100;
}
