import { estimateOneRepMax } from './oneRepMax';

export type PersonalRecordType = 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm';

type SetInput = { reps: number | null; weightKg: number | null; isWarmup: boolean };

/**
 * Bir egzersizin bu session'daki setlerinden hangi PR tiplerinin
 * İYİLEŞTİĞİNİ tespit eder — `finish_workout_session()` SQL fonksiyonundaki
 * eşdeğer mantığın saf/test edilebilir spesifikasyonu (bkz.
 * supabase/migrations/20260720162500_workout_functions.sql). Otoriter
 * kayıt orada `personal_records` tablosuna yazılır; burası yalnız kuralı
 * dokümante eder ve olası bir canlı-ekran önizlemesi için kullanılabilir.
 *
 * `max_weight` bilinçli olarak bodyweight İKAMESİ YAPMAZ (gerçek dış yük
 * anlamına gelir); diğer üç tip bodyweight setlerde `bodyweightKg`'yi
 * ağırlık yerine kullanır (aynı `coalesce(weight_kg, profil_kilosu)` kuralı).
 */
export function detectPersonalRecords(input: {
  sets: SetInput[];
  bodyweightKg: number | null;
  existing: Partial<Record<PersonalRecordType, number>>;
}): Partial<Record<PersonalRecordType, number>> {
  const workingSets = input.sets.filter((set) => !set.isWarmup);
  const improved: Partial<Record<PersonalRecordType, number>> = {};

  const beats = (type: PersonalRecordType, candidate: number | null) => {
    if (candidate === null) return;
    const existingValue = input.existing[type];
    if (existingValue === undefined || candidate > existingValue) {
      improved[type] = candidate;
    }
  };

  const maxWeight = workingSets
    .map((set) => set.weightKg)
    .filter((weight): weight is number => weight !== null)
    .reduce<number | null>((max, weight) => (max === null || weight > max ? weight : max), null);
  beats('max_weight', maxWeight);

  const maxReps = workingSets
    .map((set) => set.reps)
    .filter((reps): reps is number => reps !== null)
    .reduce<number | null>((max, reps) => (max === null || reps > max ? reps : max), null);
  beats('max_reps', maxReps);

  let maxVolume: number | null = null;
  let maxOneRepMax: number | null = null;
  for (const set of workingSets) {
    if (set.reps === null || set.reps <= 0) continue;
    const effectiveWeight = set.weightKg ?? input.bodyweightKg;
    if (effectiveWeight === null) continue;

    const volume = set.reps * effectiveWeight;
    if (maxVolume === null || volume > maxVolume) maxVolume = volume;

    const oneRepMax = estimateOneRepMax({ weightKg: effectiveWeight, reps: set.reps });
    if (maxOneRepMax === null || oneRepMax > maxOneRepMax) maxOneRepMax = oneRepMax;
  }
  beats('max_volume', maxVolume);
  beats('estimated_1rm', maxOneRepMax);

  return improved;
}
