import { describe, expect, it } from 'vitest';

import { computeSessionVolumeKg, computeSetVolumeKg } from './volume';

describe('computeSetVolumeKg', () => {
  it('ağırlıklı set: tekrar × ağırlık', () => {
    expect(computeSetVolumeKg({ reps: 10, weightKg: 60, isBodyweight: false, bodyweightKg: 80 })).toBe(600);
  });

  it('bodyweight set: ağırlık yerine vücut ağırlığı kullanılır', () => {
    expect(computeSetVolumeKg({ reps: 10, weightKg: null, isBodyweight: true, bodyweightKg: 75 })).toBe(750);
  });

  it('vücut ağırlığı bilinmiyorsa null döner (yanlış sayı üretmez)', () => {
    expect(computeSetVolumeKg({ reps: 10, weightKg: null, isBodyweight: true, bodyweightKg: null })).toBeNull();
  });

  it('0 tekrar 0 hacim üretir', () => {
    expect(computeSetVolumeKg({ reps: 0, weightKg: 60, isBodyweight: false, bodyweightKg: null })).toBe(0);
  });
});

describe('computeSessionVolumeKg', () => {
  it('ısınma setlerini hariç tutar', () => {
    const sets = [
      { reps: 10, weightKg: 60, isBodyweight: false, isWarmup: true },
      { reps: 8, weightKg: 80, isBodyweight: false, isWarmup: false },
    ];
    expect(computeSessionVolumeKg(sets, null)).toBe(640);
  });

  it('karışık bodyweight + ağırlıklı setleri toplar', () => {
    const sets = [
      { reps: 10, weightKg: 60, isBodyweight: false, isWarmup: false },
      { reps: 8, weightKg: null, isBodyweight: true, isWarmup: false },
    ];
    expect(computeSessionVolumeKg(sets, 70)).toBe(1160);
  });
});
