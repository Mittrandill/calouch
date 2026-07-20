import { describe, expect, it } from 'vitest';

import { estimateWorkoutCalories } from './calorieBurn';

describe('estimateWorkoutCalories', () => {
  it('tek MET değeriyle basit hesap: MET × kilo × saat', () => {
    const result = estimateWorkoutCalories({
      weightKg: 80,
      durationHours: 1,
      sets: [{ metValue: 5, isWarmup: false }],
    });
    expect(result).toBe(400);
  });

  it('birden çok egzersizin MET ortalamasını alır', () => {
    const result = estimateWorkoutCalories({
      weightKg: 80,
      durationHours: 1,
      sets: [
        { metValue: 5, isWarmup: false },
        { metValue: 3, isWarmup: false },
      ],
    });
    expect(result).toBe(320); // avg MET 4 × 80 × 1
  });

  it('ısınma setlerini ortalamaya katmaz', () => {
    const result = estimateWorkoutCalories({
      weightKg: 80,
      durationHours: 1,
      sets: [
        { metValue: 2, isWarmup: true },
        { metValue: 5, isWarmup: false },
      ],
    });
    expect(result).toBe(400);
  });

  it('kilo bilinmiyorsa null döner (yanlış sayı üretmez)', () => {
    expect(
      estimateWorkoutCalories({ weightKg: null, durationHours: 1, sets: [{ metValue: 5, isWarmup: false }] }),
    ).toBeNull();
  });

  it('yalnız ısınma seti varsa null döner', () => {
    expect(
      estimateWorkoutCalories({ weightKg: 80, durationHours: 1, sets: [{ metValue: 5, isWarmup: true }] }),
    ).toBeNull();
  });

  it('süre 0 ise null döner', () => {
    expect(
      estimateWorkoutCalories({ weightKg: 80, durationHours: 0, sets: [{ metValue: 5, isWarmup: false }] }),
    ).toBeNull();
  });
});
