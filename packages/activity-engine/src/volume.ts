/**
 * Bir setin hacmi (kg). PRD §06 "Toplam hacim: set x tekrar x ağırlık;
 * bodyweight/assisted hareketler ayrıca modellenir" — bodyweight setlerde
 * `weightKg` yerine kullanıcının vücut ağırlığı (`bodyweightKg`) kullanılır,
 * `finish_workout_session()` SQL fonksiyonundaki
 * `coalesce(weight_kg, profile.weight_kg)` ikamesiyle aynı kural.
 */
export function computeSetVolumeKg(input: {
  reps: number;
  weightKg: number | null;
  isBodyweight: boolean;
  bodyweightKg: number | null;
}): number | null {
  if (input.reps <= 0) return 0;

  const effectiveWeight = input.isBodyweight ? input.bodyweightKg : (input.weightKg ?? input.bodyweightKg);
  if (effectiveWeight === null || effectiveWeight < 0) return null;

  return Math.round(input.reps * effectiveWeight * 100) / 100;
}

/** Bir session'daki tüm (ısınma hariç) setlerin toplam hacmi. */
export function computeSessionVolumeKg(
  sets: { reps: number; weightKg: number | null; isBodyweight: boolean; isWarmup: boolean }[],
  bodyweightKg: number | null,
): number | null {
  let total = 0;
  for (const set of sets) {
    if (set.isWarmup) continue;
    const setVolume = computeSetVolumeKg({ ...set, bodyweightKg });
    if (setVolume === null) return null;
    total += setVolume;
  }
  return Math.round(total * 100) / 100;
}
