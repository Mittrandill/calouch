import { describe, expect, it } from 'vitest';

import { buildDailyActivityUpsertPayload, InvalidActivitySampleError } from './upsertPayload';
import type { RawDailyActivitySample } from './types';

const userId = '11111111-1111-4111-8111-111111111111';

function sample(overrides: Partial<RawDailyActivitySample> = {}): RawDailyActivitySample {
  return {
    date: '2026-07-18',
    steps: 4200,
    activeEnergyKcal: 250.5,
    source: 'apple_health',
    platformRecordId: 'hk-abc',
    ...overrides,
  };
}

describe('buildDailyActivityUpsertPayload', () => {
  it('maps a valid sample to an upsert row', () => {
    const payload = buildDailyActivityUpsertPayload(sample(), userId);

    expect(payload).toMatchObject({
      user_id: userId,
      activity_date: '2026-07-18',
      source: 'apple_health',
      steps: 4200,
      active_energy_kcal: 250.5,
      platform_record_id: 'hk-abc',
    });
    expect(typeof payload.synced_at).toBe('string');
  });

  it('allows steps-only samples', () => {
    const payload = buildDailyActivityUpsertPayload(sample({ activeEnergyKcal: null }), userId);
    expect(payload.steps).toBe(4200);
    expect(payload.active_energy_kcal).toBeNull();
  });

  it('allows active-energy-only samples', () => {
    const payload = buildDailyActivityUpsertPayload(sample({ steps: null }), userId);
    expect(payload.active_energy_kcal).toBe(250.5);
    expect(payload.steps).toBeNull();
  });

  it('rejects a sample with neither steps nor active energy', () => {
    expect(() =>
      buildDailyActivityUpsertPayload(sample({ steps: null, activeEnergyKcal: null }), userId),
    ).toThrow(InvalidActivitySampleError);
  });

  it('rejects steps above the sanity range', () => {
    expect(() => buildDailyActivityUpsertPayload(sample({ steps: 300_000 }), userId)).toThrow(
      InvalidActivitySampleError,
    );
  });

  it('rejects negative steps', () => {
    expect(() => buildDailyActivityUpsertPayload(sample({ steps: -1 }), userId)).toThrow(
      InvalidActivitySampleError,
    );
  });

  it('rejects active energy above the sanity range', () => {
    expect(() =>
      buildDailyActivityUpsertPayload(sample({ activeEnergyKcal: 25_000 }), userId),
    ).toThrow(InvalidActivitySampleError);
  });
});
