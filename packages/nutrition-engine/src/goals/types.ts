/**
 * Hedef motoru sözleşmesi. PRD §8.2-8.4.
 *
 * Bu paket saf TypeScript'tir: React Native, Supabase veya herhangi bir
 * framework importu ESLint tarafından reddedilir (§01 kabul kriteri
 * "Domain paketleri UI/framework bağımlılığından ayrılmış"). Girdi argüman
 * olarak gelir, çıktı değer olarak döner — I/O yok, yan etki yok.
 */

/**
 * Biyolojik cinsiyet — bazal metabolizma hesabının girdisi.
 *
 * PRD §8.2'de bu alan YOKTU; hesabın doğruluğu için eklendi (karar kaydı:
 * 14-open-decisions.md). Opsiyoneldir: `unspecified`, kullanıcının adımı
 * atlamasıdır ve §00'ın "veri reddedilse de temel kullanım çalışır"
 * ilkesi gereği geçerli bir durumdur.
 *
 * Burada sorulan şey kimlik değil fizyolojidir; Mifflin-St Jeor'un sabiti
 * yağsız kütle farkını temsil eder. Kullanıcı sonucu her hâlükârda elle
 * değiştirebilir (§8.4).
 */
export type BiologicalSex = 'male' | 'female' | 'unspecified';

/** PRD §8.2 "Aktivite seviyesi". */
export type ActivityLevel =
  /** Masa başı, planlı egzersiz yok. */
  | 'sedentary'
  /** Haftada 1-3 gün hafif egzersiz. */
  | 'light'
  /** Haftada 3-5 gün orta egzersiz. */
  | 'moderate'
  /** Haftada 6-7 gün egzersiz. */
  | 'active'
  /** Günde iki antrenman veya fiziksel iş. */
  | 'very_active';

/** PRD §8.3 hedef listesi — birebir. */
export type PrimaryGoal =
  | 'lose_weight'
  | 'gain_weight'
  | 'maintain_weight'
  | 'build_muscle'
  | 'eat_healthy'
  | 'increase_activity'
  | 'training_routine'
  | 'improve_measurements';

export type GoalInput = {
  /** PRD §8.2 yalnız doğum YILI topluyor; yaş bu yüzden ±1 yıl hassasiyetinde. */
  birthYear: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
  /**
   * PRD §8.2 "Haftalık hedef değişim" — kg/hafta, işaretsiz.
   * Yön `primaryGoal`'dan gelir; 0.5 hem verme hem alma için "haftada yarım kilo".
   */
  weeklyChangeKg: number;
  /** Yaş hesabı için. Test edilebilirlik adına argüman — `new Date()` çağrılmaz. */
  currentYear: number;
};

/**
 * Hedefin ne kadar güvenilir olduğu.
 *
 * §00 "Belirsizlik görünürdür" ilkesi AI çıktısı için yazılmış ama aynı
 * dürüstlük deterministik tahminde de geçerli: cinsiyet bilinmiyorken
 * bazal metabolizma ±83 kcal belirsizlik taşır ve bunu saklamayız.
 */
export type GoalConfidence = 'high' | 'low';

export type GoalWarning =
  /** §8.4: "Riskli derecede düşük hedeflerde kullanıcı uyarılır." */
  | 'target_below_safe_minimum'
  /** Hedef kalori bazal metabolizmanın altında. */
  | 'target_below_bmr'
  /** Haftalık değişim hızı sürdürülebilir aralığın üstünde. */
  | 'weekly_change_too_fast'
  /** Cinsiyet verilmedi; hesap orta noktadan yürüdü. */
  | 'sex_unspecified';

export type MacroTargets = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type GoalResult = {
  /** Bazal metabolizma (kcal/gün). */
  bmr: number;
  /** Günlük enerji ihtiyacı = bmr × aktivite çarpanı (kcal/gün). */
  tdee: number;
  /** Hedef kalori — güvenlik tabanına kırpılmış olabilir. */
  targetCalories: number;
  macros: MacroTargets;
  waterMl: number;

  confidence: GoalConfidence;
  /** Kullanıcıya gösterilecek uyarılar. Boş dizi = sorun yok. */
  warnings: GoalWarning[];

  /**
   * §8.4: "Formül ve sürümü kaydedilir."
   *
   * Bu değer profille birlikte saklanır. Formül ileride değişirse eski
   * kullanıcıların hedefleri sessizce yeniden hesaplanmaz — hangi sürümle
   * üretildiği bilinir ve geçiş bilinçli yapılır.
   */
  formulaVersion: string;
};
