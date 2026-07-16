import {
  FAT_G_PER_KG_MINIMUM,
  FIBER_G_PER_1000_KCAL,
  KCAL_PER_G,
  PROTEIN_G_PER_KG,
  WATER_ML_PER_KG,
} from './constants';
import type { MacroTargets, PrimaryGoal } from './types';

/** Yağdan gelmesi hedeflenen kalori payı; g/kg tabanıyla birlikte alt sınır oluşturur. */
const FAT_CALORIE_SHARE = 0.25;

/**
 * Protein ve yağ hedefinin dayandığı ağırlık.
 *
 * Kilo verirken mevcut ağırlık kullanılırsa, 120 kg'lık bir kullanıcı için
 * 1.8 g/kg → 216 g protein çıkar: hem gereksiz hem uygulanamaz. Yağ dokusu
 * protein ihtiyacı yaratmaz; ihtiyacı yağsız kütle belirler ve hedef ağırlık
 * ona çok daha yakın bir vekildir.
 *
 * Kilo alırken tersi geçerli değildir: hedef ağırlık henüz mevcut olmayan
 * kütledir, bu yüzden mevcut ağırlık kullanılır.
 */
export function referenceWeightKg(input: {
  weightKg: number;
  targetWeightKg: number;
  primaryGoal: PrimaryGoal;
}): number {
  if (input.primaryGoal === 'lose_weight') {
    return Math.min(input.weightKg, input.targetWeightKg);
  }
  return input.weightKg;
}

/**
 * Makro hedefleri.
 *
 * Öncelik sırası: protein (kas koruma) → yağ (hormon/vitamin tabanı) →
 * karbonhidrat (kalanı doldurur). Bu sıra bilinçlidir: kalori kısıtlandığında
 * ilk feda edilen karbonhidrat olmalıdır.
 */
export function macroTargets(input: {
  targetCalories: number;
  referenceWeightKg: number;
  primaryGoal: PrimaryGoal;
}): MacroTargets {
  const proteinG = Math.round(PROTEIN_G_PER_KG[input.primaryGoal] * input.referenceWeightKg);

  // Yağ: g/kg tabanı ile kalori payından büyük olanı. Taban sağlık sınırı,
  // pay ise yüksek kalorili planlarda yağın makul kalmasını sağlar — yoksa
  // kalan tamamen karbonhidrata giderdi.
  const fatFromShare = (input.targetCalories * FAT_CALORIE_SHARE) / KCAL_PER_G.fat;
  const fatFloor = FAT_G_PER_KG_MINIMUM * input.referenceWeightKg;
  const fatG = Math.round(Math.max(fatFloor, fatFromShare));

  const remainingCalories =
    input.targetCalories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;

  // Uç durum: çok düşük kalori + yüksek referans ağırlık. Protein ve yağ
  // tabanı hedefi aşabilir. Karbonhidratı negatife düşürmek yerine sıfırlanır;
  // bu senaryoda zaten `target_below_safe_minimum` uyarısı üretilmiştir ve
  // kullanıcı değerleri elle düzeltebilir (§8.4).
  const carbsG = Math.max(0, Math.round(remainingCalories / KCAL_PER_G.carbs));

  const fiberG = Math.round((input.targetCalories / 1000) * FIBER_G_PER_1000_KCAL);

  return { proteinG, carbsG, fatG, fiberG };
}

/**
 * Günlük su hedefi (ml).
 *
 * Mevcut ağırlığa dayanır — su ihtiyacını yağsız kütle değil toplam kütle ve
 * metabolik yük belirler.
 */
export function waterTargetMl(weightKg: number): number {
  const raw = WATER_ML_PER_KG * weightKg;
  // 100 ml'ye yuvarlanır: "2450 ml" sahte bir hassasiyet iddiasıdır.
  return Math.round(raw / 100) * 100;
}
