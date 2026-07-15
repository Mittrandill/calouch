import { describe, expect, it, vi } from 'vitest';

import { Analytics, findViolations, SensitiveAnalyticsError, type AnalyticsTransport } from './index';

const makeTransport = () => {
  const sent: { name: string; props: Record<string, unknown> }[] = [];
  const transport: AnalyticsTransport = { send: (name, props) => sent.push({ name, props }) };
  return { transport, sent };
};

const makeAnalytics = (hasConsent = true) => {
  const { transport, sent } = makeTransport();
  return {
    sent,
    analytics: new Analytics({ transport, hasConsent: () => hasConsent, throwOnViolation: true }),
  };
};

describe('katalog olayları', () => {
  it('geçerli olayı iletir', () => {
    const { analytics, sent } = makeAnalytics();
    analytics.track({ name: 'screen_viewed', props: { screen: 'today' } });
    expect(sent).toEqual([{ name: 'screen_viewed', props: { screen: 'today' } }]);
  });

  it('hata sınıfını iletir, hata metnini değil', () => {
    const { analytics, sent } = makeAnalytics();
    analytics.track({ name: 'auth_failed', props: { method: 'email', reason: 'network' } });
    expect(sent[0]?.props).toEqual({ method: 'email', reason: 'network' });
  });
});

/** PRD §09: "analitik reddedilse de temel manuel kullanım çalışır." */
describe('rıza kapısı', () => {
  it('rıza yokken olay gönderilmez', () => {
    const { analytics, sent } = makeAnalytics(false);
    analytics.track({ name: 'app_opened', props: { isColdStart: true } });
    expect(sent).toHaveLength(0);
  });

  it('rıza yokken olay kuyruklanmaz', () => {
    // Rıza sonradan verilse bile geçmiş olaylar gönderilmemeli.
    const { transport, sent } = makeTransport();
    let consent = false;
    const analytics = new Analytics({
      transport,
      hasConsent: () => consent,
      throwOnViolation: true,
    });

    analytics.track({ name: 'app_opened', props: { isColdStart: true } });
    consent = true;
    analytics.track({ name: 'signed_out', props: {} });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.name).toBe('signed_out');
  });

  it('rıza yokken hassas payload bile sessizce düşer', () => {
    const { analytics, sent } = makeAnalytics(false);
    // @ts-expect-error katalog dışı — çalışma zamanı davranışını sınıyoruz
    analytics.track({ name: 'screen_viewed', props: { email: 'a@b.com' } });
    expect(sent).toHaveLength(0);
  });
});

/** PRD §02: "Hiçbir health/personal değer analitik payload'a girmez." */
describe('hassas veri savunması', () => {
  it.each([
    ['weightKg', 82.4],
    ['calories', 2100],
    ['proteinG', 140],
    ['birthYear', 1990],
    ['email', 'ali@example.com'],
    ['fullName', 'Ali Yılmaz'],
    ['photoUri', 'file:///meal.jpg'],
    ['allergyNote', 'fındık'],
  ])('%s alanı reddedilir', (key, value) => {
    const { analytics } = makeAnalytics();
    // Not: burada `@ts-expect-error` YOK ve bu kasıtlı. Hesaplanmış anahtar
    // (`[key]: value`) TypeScript'in fazla-alan denetimini atlatır — yani tip
    // sistemi bu sızıntıyı YAKALAMAZ. Çalışma zamanı savunmasının var olma
    // sebebi tam olarak budur.
    expect(() =>
      analytics.track({ name: 'screen_viewed', props: { screen: 'today', [key]: value } }),
    ).toThrow(SensitiveAnalyticsError);
  });

  it('masum alan adı altındaki e-posta değeri yakalanır', () => {
    expect(findViolations({ ref: 'ali@example.com' })).toEqual([{ key: 'ref', rule: 'value' }]);
  });

  it('JWT değeri yakalanır', () => {
    expect(findViolations({ ref: 'eyJhbGciOiJIUzI1NiJ9.payload' })).toHaveLength(1);
  });

  it('serbest metin uzunluğu üzerinden yakalanır', () => {
    expect(findViolations({ ref: 'x'.repeat(65) })).toEqual([{ key: 'ref', rule: 'value' }]);
  });

  it('iç içe nesne reddedilir', () => {
    expect(findViolations({ ref: { nested: 1 } })).toEqual([{ key: 'ref', rule: 'type' }]);
  });

  it('kategorik değer ve sayaç temiz sayılır', () => {
    expect(findViolations({ screen: 'today', isColdStart: true, durationMs: 412 })).toEqual([]);
  });

  it('katalog dışı olay adı reddedilir', () => {
    const { analytics } = makeAnalytics();
    // @ts-expect-error katalogda yok
    expect(() => analytics.track({ name: 'meal_logged', props: {} })).toThrow(
      SensitiveAnalyticsError,
    );
  });
});

describe('production davranışı', () => {
  it('ihlalde çökmez, olayı düşürür', () => {
    const { transport, sent } = makeTransport();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const analytics = new Analytics({
      transport,
      hasConsent: () => true,
      throwOnViolation: false,
    });

    expect(() =>
      // @ts-expect-error hassas payload
      analytics.track({ name: 'screen_viewed', props: { weightKg: 82 } }),
    ).not.toThrow();

    expect(sent).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
