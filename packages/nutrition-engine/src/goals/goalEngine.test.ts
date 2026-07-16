import { describe, expect, it } from 'vitest';

import { GOAL_FORMULA_VERSION } from './constants';
import { basalMetabolicRate, calorieDirection, dailyCalorieDelta } from './energy';
import { calculateGoals, GoalInputError, requiresProfessionalAdviceNotice } from './goalEngine';
import { referenceWeightKg, waterTargetMl } from './macros';
import type { GoalInput } from './types';

/** 30 yaşında, 180 cm, 80 kg erkek; orta aktivite; haftada 0.5 kg vermek istiyor. */
const baseInput: GoalInput = {
  birthYear: 1996,
  currentYear: 2026,
  heightCm: 180,
  weightKg: 80,
  targetWeightKg: 75,
  sex: 'male',
  activityLevel: 'moderate',
  primaryGoal: 'lose_weight',
  weeklyChangeKg: 0.5,
};

describe('bazal metabolizma (Mifflin-St Jeor)', () => {
  it('erkek referans değeri elle hesapla örtüşür', () => {
    // 10·80 + 6.25·180 − 5·30 + 5 = 800 + 1125 − 150 + 5 = 1780
    expect(basalMetabolicRate({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' })).toBe(1780);
  });

  it('kadın referans değeri elle hesapla örtüşür', () => {
    // 10·60 + 6.25·165 − 5·30 − 161 = 600 + 1031.25 − 150 − 161 = 1320.25
    expect(basalMetabolicRate({ weightKg: 60, heightCm: 165, age: 30, sex: 'female' })).toBe(1320);
  });

  it('cinsiyet farkı tam 166 kcal', () => {
    const shared = { weightKg: 80, heightCm: 180, age: 30 } as const;
    const male = basalMetabolicRate({ ...shared, sex: 'male' });
    const female = basalMetabolicRate({ ...shared, sex: 'female' });

    // Bu 166 kcal, cinsiyeti sormamızın sebebi. Ortalamaya yuvarlansaydı
    // her kullanıcıda ±83 kcal sistematik hata olurdu.
    expect(male - female).toBe(166);
  });

  it('cinsiyet verilmediğinde iki değerin tam ortasında durur', () => {
    const shared = { weightKg: 80, heightCm: 180, age: 30 } as const;
    const male = basalMetabolicRate({ ...shared, sex: 'male' });
    const female = basalMetabolicRate({ ...shared, sex: 'female' });
    const unspecified = basalMetabolicRate({ ...shared, sex: 'unspecified' });

    expect(unspecified).toBe((male + female) / 2);
    expect(male - unspecified).toBe(83);
    expect(unspecified - female).toBe(83);
  });

  it('yaş arttıkça düşer', () => {
    const young = basalMetabolicRate({ weightKg: 80, heightCm: 180, age: 25, sex: 'male' });
    const old = basalMetabolicRate({ weightKg: 80, heightCm: 180, age: 65, sex: 'male' });
    expect(young - old).toBe(200); // 40 yıl × 5 kcal
  });

  it('uç girdide negatife düşmez', () => {
    // Formül teorik olarak negatif verebilir; negatif bazal metabolizma
    // aşağı akışta anlamsız makro üretirdi.
    expect(
      basalMetabolicRate({ weightKg: 20, heightCm: 80, age: 120, sex: 'female' }),
    ).toBeGreaterThanOrEqual(0);
  });
});

describe('günlük enerji ve kalori yönü', () => {
  it('aktivite seviyesi arttıkça enerji ihtiyacı artar', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
    const values = levels.map(
      (activityLevel) => calculateGoals({ ...baseInput, activityLevel }).tdee,
    );

    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('yalnız kilo verme/alma hedefleri kalori dengesini değiştirir', () => {
    expect(calorieDirection('lose_weight')).toBe(-1);
    expect(calorieDirection('gain_weight')).toBe(1);
    expect(calorieDirection('build_muscle')).toBe(1);

    // "Sağlıklı beslenmek" seçen kullanıcıya açık dayatmak, istemediği bir
    // kilo kaybı üretirdi.
    expect(calorieDirection('eat_healthy')).toBe(0);
    expect(calorieDirection('maintain_weight')).toBe(0);
    expect(calorieDirection('training_routine')).toBe(0);
    expect(calorieDirection('increase_activity')).toBe(0);
    expect(calorieDirection('improve_measurements')).toBe(0);
  });

  it('haftalık 0.5 kg, günlük 550 kcal açık demek', () => {
    // 0.5 × 7700 / 7 = 550
    expect(dailyCalorieDelta('lose_weight', 0.5)).toBe(-550);
    expect(dailyCalorieDelta('gain_weight', 0.5)).toBe(550);
  });

  it('kalori dengesini değiştirmeyen hedefte haftalık değişim yok sayılır', () => {
    expect(dailyCalorieDelta('eat_healthy', 1)).toBe(0);
  });
});

describe('hedef kalori', () => {
  it('referans senaryo elle hesapla örtüşür', () => {
    const result = calculateGoals(baseInput);

    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(Math.round(1780 * 1.55)); // 2759
    expect(result.targetCalories).toBe(2759 - 550); // 2209
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBe('high');
  });

  it('koruma hedefinde hedef kalori enerji ihtiyacına eşit', () => {
    const result = calculateGoals({ ...baseInput, primaryGoal: 'maintain_weight' });
    expect(result.targetCalories).toBe(result.tdee);
  });
});

/** PRD §8.4: "Riskli derecede düşük hedeflerde kullanıcı uyarılır." */
describe('güvenlik tabanı', () => {
  const riskyInput: GoalInput = {
    ...baseInput,
    sex: 'female',
    birthYear: 1966,
    heightCm: 150,
    weightKg: 50,
    targetWeightKg: 45,
    activityLevel: 'sedentary',
    weeklyChangeKg: 1,
  };

  it('taban altına inen hedefi kırpar ve uyarır', () => {
    const result = calculateGoals(riskyInput);

    // Ham hesap: TDEE 1172 − 1100 = 72 kcal. Motor bunu ÖNERMEZ.
    expect(result.targetCalories).toBe(1200);
    expect(result.warnings).toContain('target_below_safe_minimum');
  });

  it('kırpılmış hedef bile bazal metabolizmanın altındaysa ayrıca uyarır', () => {
    const result = calculateGoals({
      ...baseInput,
      sex: 'female',
      birthYear: 2001,
      heightCm: 180,
      weightKg: 90,
      targetWeightKg: 70,
      activityLevel: 'sedentary',
      weeklyChangeKg: 2,
    });

    expect(result.targetCalories).toBe(1200);
    expect(result.warnings).toContain('target_below_safe_minimum');
    expect(result.warnings).toContain('target_below_bmr');
    expect(result.warnings).toContain('weekly_change_too_fast');
  });

  it('sürdürülemez hızda uyarır ama engellemez', () => {
    const result = calculateGoals({ ...baseInput, weeklyChangeKg: 1.5 });
    expect(result.warnings).toContain('weekly_change_too_fast');
    expect(result.targetCalories).toBeGreaterThan(0);
  });

  it('riskli hedefte profesyonel destek önerisi tetiklenir', () => {
    // §00: ürün teşhis/tedavi vermez; yapabileceği tek şey uzmana yönlendirmek.
    expect(requiresProfessionalAdviceNotice(calculateGoals(riskyInput).warnings)).toBe(true);
  });

  it('sağlıklı hedefte profesyonel destek önerisi çıkmaz', () => {
    expect(requiresProfessionalAdviceNotice(calculateGoals(baseInput).warnings)).toBe(false);
  });

  it('erkek tabanı kadın tabanından yüksek', () => {
    const shared = {
      ...baseInput,
      heightCm: 150,
      weightKg: 50,
      targetWeightKg: 45,
      activityLevel: 'sedentary',
      birthYear: 1966,
      weeklyChangeKg: 1,
    } as const;

    expect(calculateGoals({ ...shared, sex: 'male' }).targetCalories).toBe(1500);
    expect(calculateGoals({ ...shared, sex: 'female' }).targetCalories).toBe(1200);
  });

  it('cinsiyet bilinmiyorken koruyucu (düşük) taban uygulanır', () => {
    const shared = {
      ...baseInput,
      sex: 'unspecified',
      heightCm: 150,
      weightKg: 50,
      targetWeightKg: 45,
      activityLevel: 'sedentary',
      birthYear: 1966,
      weeklyChangeKg: 1,
    } as const;
    expect(calculateGoals(shared).targetCalories).toBe(1200);
  });
});

/** §00 "Belirsizlik görünürdür" — deterministik tahminde de geçerli. */
describe('güven seviyesi', () => {
  it('cinsiyet verilmediğinde düşük güven ve uyarı döner', () => {
    const result = calculateGoals({ ...baseInput, sex: 'unspecified' });
    expect(result.confidence).toBe('low');
    expect(result.warnings).toContain('sex_unspecified');
  });

  it('cinsiyet verildiğinde yüksek güven ve uyarı yok', () => {
    expect(calculateGoals({ ...baseInput, sex: 'female' }).confidence).toBe('high');
    expect(calculateGoals({ ...baseInput, sex: 'female' }).warnings).not.toContain(
      'sex_unspecified',
    );
  });

  it('cinsiyet atlanabilir olmalı: hesap yine de tam sonuç üretir', () => {
    // §00: veri reddedilse de temel kullanım çalışır.
    const result = calculateGoals({ ...baseInput, sex: 'unspecified' });
    expect(result.targetCalories).toBeGreaterThan(0);
    expect(result.macros.proteinG).toBeGreaterThan(0);
    expect(result.waterMl).toBeGreaterThan(0);
  });
});

describe('makrolar', () => {
  it('referans senaryo elle hesapla örtüşür', () => {
    const result = calculateGoals(baseInput);
    // ref ağırlık = min(80, 75) = 75; protein 1.8 × 75 = 135
    expect(result.macros.proteinG).toBe(135);
    // yağ: max(0.8 × 75 = 60, 2209 × 0.25 / 9 = 61.4) → 61
    expect(result.macros.fatG).toBe(61);
    // karb: (2209 − 540 − 549) / 4 = 280
    expect(result.macros.carbsG).toBe(280);
    // lif: 2209 / 1000 × 14 = 30.9 → 31
    expect(result.macros.fiberG).toBe(31);
  });

  it('makro kalorileri hedefe yakın toplanır', () => {
    const result = calculateGoals(baseInput);
    const macroCalories =
      result.macros.proteinG * 4 + result.macros.carbsG * 4 + result.macros.fatG * 9;

    // Yuvarlama payı: her makro tam grama yuvarlanır.
    expect(Math.abs(macroCalories - result.targetCalories)).toBeLessThanOrEqual(10);
  });

  it('kas geliştirme hedefinde protein en yüksek', () => {
    const muscle = calculateGoals({ ...baseInput, primaryGoal: 'build_muscle', targetWeightKg: 85 });
    const healthy = calculateGoals({ ...baseInput, primaryGoal: 'eat_healthy', targetWeightKg: 80 });
    expect(muscle.macros.proteinG).toBeGreaterThan(healthy.macros.proteinG);
  });

  it('kilo verirken protein hedef ağırlığa dayanır', () => {
    // 120 kg'lık kullanıcıya 1.8 × 120 = 216 g protein hem gereksiz hem
    // uygulanamaz olurdu. Yağ dokusu protein ihtiyacı yaratmaz.
    expect(referenceWeightKg({ weightKg: 120, targetWeightKg: 80, primaryGoal: 'lose_weight' })).toBe(80);
  });

  it('kilo alırken protein mevcut ağırlığa dayanır', () => {
    // Hedef ağırlık henüz var olmayan kütledir.
    expect(referenceWeightKg({ weightKg: 70, targetWeightKg: 85, primaryGoal: 'gain_weight' })).toBe(70);
    expect(referenceWeightKg({ weightKg: 70, targetWeightKg: 85, primaryGoal: 'build_muscle' })).toBe(70);
  });

  it('hedef ağırlık mevcuttan yüksekken bile kilo vermede düşüğü seçer', () => {
    expect(referenceWeightKg({ weightKg: 70, targetWeightKg: 90, primaryGoal: 'lose_weight' })).toBe(70);
  });

  it('yağ sağlık tabanının altına inmez', () => {
    // Agresif açıkta kalan tamamen karbonhidrata gitseydi yağ sıfırlanırdı.
    const result = calculateGoals({
      ...baseInput,
      sex: 'female',
      heightCm: 160,
      weightKg: 60,
      targetWeightKg: 55,
      activityLevel: 'sedentary',
      weeklyChangeKg: 1,
    });
    expect(result.macros.fatG).toBeGreaterThanOrEqual(Math.round(0.8 * 55));
  });

  it('karbonhidrat asla negatif olmaz', () => {
    const result = calculateGoals({
      ...baseInput,
      sex: 'female',
      heightCm: 180,
      weightKg: 120,
      targetWeightKg: 115,
      activityLevel: 'sedentary',
      weeklyChangeKg: 2,
      birthYear: 1966,
    });
    expect(result.macros.carbsG).toBeGreaterThanOrEqual(0);
  });

  it('her hedef için makro üretir', () => {
    const goals = [
      'lose_weight',
      'gain_weight',
      'maintain_weight',
      'build_muscle',
      'eat_healthy',
      'increase_activity',
      'training_routine',
      'improve_measurements',
    ] as const;

    for (const primaryGoal of goals) {
      const result = calculateGoals({ ...baseInput, primaryGoal });
      expect(result.macros.proteinG, primaryGoal).toBeGreaterThan(0);
      expect(result.macros.fatG, primaryGoal).toBeGreaterThan(0);
      expect(result.macros.fiberG, primaryGoal).toBeGreaterThan(0);
    }
  });
});

describe('su', () => {
  it('ağırlığa göre hesaplanır', () => {
    expect(waterTargetMl(80)).toBe(2800); // 35 × 80
    expect(waterTargetMl(60)).toBe(2100);
  });

  it('100 ml’ye yuvarlanır', () => {
    // "2432 ml" sahte hassasiyet iddiasıdır.
    expect(waterTargetMl(69.5) % 100).toBe(0);
  });
});

describe('girdi doğrulaması', () => {
  it.each([
    ['kilo çok düşük', { weightKg: 10 }],
    ['kilo çok yüksek', { weightKg: 600 }],
    ['boy çok düşük', { heightCm: 50 }],
    ['boy çok yüksek', { heightCm: 300 }],
    ['hedef kilo aralık dışı', { targetWeightKg: 5 }],
    ['haftalık değişim negatif', { weeklyChangeKg: -1 }],
    ['haftalık değişim çok yüksek', { weeklyChangeKg: 3 }],
    ['NaN kilo', { weightKg: Number.NaN }],
  ])('%s reddedilir', (_label, override) => {
    expect(() => calculateGoals({ ...baseInput, ...override })).toThrow(GoalInputError);
  });

  it('13 yaş altı reddedilir', () => {
    // Çocuk/ergen kalori hedefi büyüme eğrisi ister; ürün kapsamı dışı (§00).
    expect(() => calculateGoals({ ...baseInput, birthYear: 2016 })).toThrow(GoalInputError);
  });

  it('120 yaş üstü reddedilir', () => {
    expect(() => calculateGoals({ ...baseInput, birthYear: 1900 })).toThrow(GoalInputError);
  });
});

/**
 * §00 değişmez kural: "Kalori ve makrolar ... deterministik hesap
 * motorundan gelir."
 */
describe('determinizm ve sürümleme', () => {
  it('aynı girdi her zaman aynı çıktıyı verir', () => {
    const first = calculateGoals(baseInput);
    const second = calculateGoals(baseInput);
    expect(first).toEqual(second);
  });

  it('sonuç formül sürümünü taşır', () => {
    // §8.4: "Formül ve sürümü kaydedilir." Bu değer profile yazılır ki
    // formül değişince eski hedefler sessizce yeniden hesaplanmasın.
    expect(calculateGoals(baseInput).formulaVersion).toBe(GOAL_FORMULA_VERSION);
  });

  it('sürüm etiketi kullanılan formülü adlandırır', () => {
    expect(GOAL_FORMULA_VERSION).toBe('mifflin-st-jeor-v1');
  });

  it('yaş doğum yılından ve verilen yıldan türer, sistem saatinden değil', () => {
    // Test edilebilirlik: motor `new Date()` çağırmaz.
    const a = calculateGoals({ ...baseInput, currentYear: 2026 });
    const b = calculateGoals({ ...baseInput, currentYear: 2027 });
    expect(b.bmr).toBe(a.bmr - 5); // bir yıl = −5 kcal
  });
});
