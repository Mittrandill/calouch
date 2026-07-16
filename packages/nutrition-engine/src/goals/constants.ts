import type { ActivityLevel, PrimaryGoal } from './types';

/**
 * Hedef motorunun bütün sayıları tek yerde.
 *
 * Bu dosyadaki her sabit bir karardır; koda dağılmış "sihirli sayı" olarak
 * durmaları, ileride neden öyle olduklarının kaybolması demekti.
 */

/**
 * §8.4: "Formül ve sürümü kaydedilir."
 *
 * Bu sürüm etiketi profile yazılır. Aşağıdaki sabitlerden HERHANGİ biri
 * değişirse sürüm artmalıdır — aksi hâlde iki kullanıcı aynı etiketle
 * farklı hesaplardan geçmiş olur ve geçmiş hedefler açıklanamaz hâle gelir.
 */
export const GOAL_FORMULA_VERSION = 'mifflin-st-jeor-v1';

/**
 * Mifflin-St Jeor (1990) cinsiyet sabiti.
 *
 * BMR = 10·kg + 6.25·cm − 5·yaş + s
 *
 * Erkek/kadın arasındaki 166 kcal fark, ortalama yağsız kütle farkını
 * temsil eder — kimlik değil fizyoloji.
 */
export const MIFFLIN_SEX_CONSTANT = {
  male: 5,
  female: -161,
  /**
   * Kullanıcı adımı atladığında iki sabitin orta noktası: (5 + −161) / 2.
   *
   * Bu bir tahmindir, gerçek değil: her iki yönde de ~83 kcal sapabilir.
   * Bu yüzden sonuç `confidence: 'low'` ve `sex_unspecified` uyarısıyla
   * döner — sessizce "doğru" gibi sunulmaz (§00 "Belirsizlik görünürdür").
   */
  unspecified: -78,
} as const satisfies Record<string, number>;

/**
 * Aktivite çarpanları — Mifflin-St Jeor ile birlikte kullanılan yerleşik
 * Harris-Benedict katsayıları.
 */
export const ACTIVITY_MULTIPLIER = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const satisfies Record<ActivityLevel, number>;

/**
 * 1 kg vücut yağı ≈ 7700 kcal.
 *
 * Haftalık hedef değişimi günlük kalori farkına çevirmek için kullanılır.
 * Yaklaşık bir sabittir; gerçek vücut kompozisyonu değişimi doğrusal
 * değildir, bu yüzden hedef "tahmin" olarak sunulur.
 */
export const KCAL_PER_KG_BODY_FAT = 7700;

/**
 * Sürdürülebilir kabul edilen üst hız (kg/hafta).
 * Üstünde `weekly_change_too_fast` uyarısı verilir — engellenmez, uyarılır.
 */
export const MAX_SUSTAINABLE_WEEKLY_CHANGE_KG = 1.0;

/**
 * §8.4: "Riskli derecede düşük hedeflerde kullanıcı uyarılır ve profesyonel
 * destek önerilir."
 *
 * Yaygın klinik alt sınırlar. Motor bu değerin ALTINDA bir hedef ÖNERMEZ:
 * kırpar ve uyarır. Kullanıcı yine de elle daha düşüğe çekebilir (§8.4)
 * ama ürünün kendi önerisi güvenli tarafta kalır.
 *
 * Cinsiyet bilinmiyorken düşük olan sınır uygulanır — daha koruyucu olan
 * varsayım budur.
 */
export const SAFE_MINIMUM_CALORIES = {
  male: 1500,
  female: 1200,
  unspecified: 1200,
} as const satisfies Record<string, number>;

/**
 * Protein hedefi (g/kg referans ağırlık) — hedefe göre.
 *
 * Kalori yüzdesi yerine g/kg kullanılır: kalori açığı büyüdükçe yüzde
 * tabanlı hesap protein hedefini düşürür ve kilo verirken kas kaybı
 * riskini artırır. Sporcu personaları (§00 "kas geliştiren", "ileri
 * sporcu") için doğru olan g/kg'dır.
 */
export const PROTEIN_G_PER_KG = {
  /** Açıkta kas korumak için yüksek. */
  lose_weight: 1.8,
  build_muscle: 2.0,
  gain_weight: 1.8,
  maintain_weight: 1.6,
  training_routine: 1.6,
  increase_activity: 1.4,
  improve_measurements: 1.6,
  /** Katı bir spor hedefi değil; genel sağlık aralığı yeterli. */
  eat_healthy: 1.2,
} as const satisfies Record<PrimaryGoal, number>;

/**
 * Yağ alt sınırı (g/kg referans ağırlık).
 *
 * Hormon üretimi ve yağda çözünen vitaminlerin emilimi için gereken taban.
 * Karbonhidrat kalanı doldurduğu için, bu taban olmadan agresif açıkta yağ
 * sıfıra yaklaşabilirdi.
 */
export const FAT_G_PER_KG_MINIMUM = 0.8;

/** Lif: 1000 kcal başına gram (yerleşik beslenme kılavuzu değeri). */
export const FIBER_G_PER_1000_KCAL = 14;

/** Su: vücut ağırlığının kg'ı başına ml. */
export const WATER_ML_PER_KG = 35;

export const KCAL_PER_G = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;
