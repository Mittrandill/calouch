import { describe, expect, it } from 'vitest';

import { cmToFeetInches, feetInchesToCm } from './length';
import { kgToLb, lbToKg } from './mass';

describe('boy dönüşümü', () => {
  it('180 cm ≈ 5\'11"', () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 11 });
  });

  it('12 inç taşmasını bir sonraki feet\'e devreder', () => {
    // 182.9 cm ≈ 71.996 inç → yuvarlama 72 inç = 6'0", 5'12" değil.
    expect(cmToFeetInches(182.9)).toEqual({ feet: 6, inches: 0 });
  });

  it('5\'11" -> cm -> geri 5\'11" (yuvarlama kaybı olmadan)', () => {
    const cm = feetInchesToCm(5, 11);
    expect(cmToFeetInches(cm)).toEqual({ feet: 5, inches: 11 });
  });

  it('tam feet değerinde inç sıfır', () => {
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.9, 1);
  });
});

describe('kilo dönüşümü', () => {
  it('80 kg ≈ 176.4 lb', () => {
    expect(kgToLb(80)).toBeCloseTo(176.4, 1);
  });

  it('176 lb ≈ 79.8 kg', () => {
    expect(lbToKg(176)).toBeCloseTo(79.8, 1);
  });

  it('gidiş-dönüşte 0.5 kg toleransı içinde kalır', () => {
    const original = 80;
    const roundTrip = lbToKg(kgToLb(original));
    expect(Math.abs(roundTrip - original)).toBeLessThan(0.5);
  });
});
