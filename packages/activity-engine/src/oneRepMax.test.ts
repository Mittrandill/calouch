import { describe, expect, it } from 'vitest';

import { estimateOneRepMax } from './oneRepMax';

describe('estimateOneRepMax', () => {
  it('100kg × 5 tekrar ≈ 116.67kg', () => {
    expect(estimateOneRepMax({ weightKg: 100, reps: 5 })).toBeCloseTo(116.67, 1);
  });

  it('1 tekrarda ağırlığın kendisine yakın kalır', () => {
    expect(estimateOneRepMax({ weightKg: 80, reps: 1 })).toBeCloseTo(82.67, 1);
  });

  it('ağırlık 0 ise 0 döner', () => {
    expect(estimateOneRepMax({ weightKg: 0, reps: 5 })).toBe(0);
  });

  it('tekrar 0 ise 0 döner', () => {
    expect(estimateOneRepMax({ weightKg: 100, reps: 0 })).toBe(0);
  });

  it('negatif girdilerde 0 döner (fat-finger koruması)', () => {
    expect(estimateOneRepMax({ weightKg: -10, reps: 5 })).toBe(0);
  });
});
