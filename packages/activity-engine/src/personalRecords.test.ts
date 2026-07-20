import { describe, expect, it } from 'vitest';

import { detectPersonalRecords } from './personalRecords';

describe('detectPersonalRecords', () => {
  it('rekor yoksa tüm tipler ilk kayıt olarak iyileşir', () => {
    const result = detectPersonalRecords({
      sets: [{ reps: 8, weightKg: 100, isWarmup: false }],
      bodyweightKg: null,
      existing: {},
    });
    expect(result.max_weight).toBe(100);
    expect(result.max_reps).toBe(8);
    expect(result.max_volume).toBe(800);
    expect(result.estimated_1rm).toBeCloseTo(126.67, 1);
  });

  it('önceki rekoru geçmezse hiçbir şey döndürmez', () => {
    const result = detectPersonalRecords({
      sets: [{ reps: 8, weightKg: 100, isWarmup: false }],
      bodyweightKg: null,
      existing: { max_weight: 120, max_reps: 10, max_volume: 1000, estimated_1rm: 140 },
    });
    expect(result).toEqual({});
  });

  it('ısınma setlerini yok sayar', () => {
    const result = detectPersonalRecords({
      sets: [
        { reps: 15, weightKg: 20, isWarmup: true },
        { reps: 8, weightKg: 100, isWarmup: false },
      ],
      bodyweightKg: null,
      existing: {},
    });
    expect(result.max_weight).toBe(100);
  });

  it('bodyweight setlerde max_weight İKAME YAPMAZ ama max_reps/volume/1rm vücut kilosunu kullanır', () => {
    const result = detectPersonalRecords({
      sets: [{ reps: 12, weightKg: null, isWarmup: false }],
      bodyweightKg: 75,
      existing: {},
    });
    expect(result.max_weight).toBeUndefined();
    expect(result.max_reps).toBe(12);
    expect(result.max_volume).toBe(900);
  });

  it('vücut kilosu da yoksa bodyweight set volume/1rm üretmez', () => {
    const result = detectPersonalRecords({
      sets: [{ reps: 12, weightKg: null, isWarmup: false }],
      bodyweightKg: null,
      existing: {},
    });
    expect(result.max_volume).toBeUndefined();
    expect(result.estimated_1rm).toBeUndefined();
  });
});
