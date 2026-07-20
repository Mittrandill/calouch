/**
 * MET-tabanlı tahmini antrenman kalorisi.
 *
 * calories = ortalama MET × kilo(kg) × süre(saat)
 *
 * `finish_workout_session()` SQL fonksiyonundaki OTORİTER hesapla AYNI
 * formül (bkz. supabase/migrations/20260720162500_workout_functions.sql) —
 * kalıcı toplam orada, tek transaction içinde hesaplanır. Bu fonksiyon
 * canlı ekranda antrenman devam ederken "tahmini kalori" göstergesi için
 * kullanılır; session bittiğinde gösterilen gerçek sayı sunucudan gelir.
 *
 * YAKLAŞIKLIK: set-bazında gerçek zamanlı süre TAKİP EDİLMEZ — bu yüzden
 * her setin MET'i eşit ağırlıkla ortalanır (süre payının egzersizler arası
 * eşit dağıldığı varsayımı). Isınma setleri hesaba katılmaz.
 */
export function estimateWorkoutCalories(input: {
  weightKg: number | null;
  durationHours: number;
  sets: { metValue: number; isWarmup: boolean }[];
}): number | null {
  if (input.weightKg === null || input.weightKg <= 0 || input.durationHours <= 0) return null;

  const workingSets = input.sets.filter((set) => !set.isWarmup);
  if (workingSets.length === 0) return null;

  const avgMet = workingSets.reduce((sum, set) => sum + set.metValue, 0) / workingSets.length;
  return Math.round(avgMet * input.weightKg * input.durationHours * 100) / 100;
}
