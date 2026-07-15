import { describe, expect, it } from 'vitest';

import { EnvValidationError, isProduction, parseClientEnv } from './env';

const valid = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://aaufvndbagvkpbtqefee.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_d5HmKhGJC0XJj5PSXnh3GQ_A2aUY0NX',
  EXPO_PUBLIC_ENV: 'development',
};

describe('parseClientEnv', () => {
  it('geçerli ortamı çözümler', () => {
    const env = parseClientEnv(valid);
    expect(env.EXPO_PUBLIC_ENV).toBe('development');
    expect(env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://aaufvndbagvkpbtqefee.supabase.co');
  });

  it('legacy anon JWT kabul eder', () => {
    expect(() =>
      parseClientEnv({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `eyJ${'a'.repeat(40)}` }),
    ).not.toThrow();
  });

  it('allowlist dışındaki değişkenleri taşımaz', () => {
    const env = parseClientEnv({ ...valid, EXPO_PUBLIC_FEATURE_X: 'true' });
    expect(env).not.toHaveProperty('EXPO_PUBLIC_FEATURE_X');
  });
});

/**
 * PRD §01 kabul kriteri: "Mobil bundle'da Gemini/service-role secret yok."
 * Aşağıdakiler o kriterin testidir.
 */
describe('secret sızıntısı savunması', () => {
  it.each([
    ['EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY', 'service-role'],
    ['EXPO_PUBLIC_GEMINI_API_KEY', 'Gemini'],
    ['EXPO_PUBLIC_BILLING_WEBHOOK_SECRET', 'webhook secret'],
    ['EXPO_PUBLIC_APPLE_PRIVATE_KEY', 'private key'],
  ])('%s istemci ortamında reddedilir (%s)', (key) => {
    expect(() => parseClientEnv({ ...valid, [key]: 'sızdı' })).toThrow(EnvValidationError);
  });

  it('publishable key alanına service-role anahtarı konulamaz', () => {
    expect(() =>
      parseClientEnv({
        ...valid,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `eyJ${'x'.repeat(20)}service_role${'y'.repeat(20)}`,
      }),
    ).toThrow(EnvValidationError);
  });

  it('EXPO_PUBLIC öneki olmayan server secret\'ı sorun değildir', () => {
    // Bunlar bundle'a girmez; yalnızca server ortamında yaşarlar.
    expect(() =>
      parseClientEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: 'x', GEMINI_API_KEY: 'y' }),
    ).not.toThrow();
  });
});

describe('doğrulama', () => {
  it('eksik değişkeni açık mesajla reddeder', () => {
    expect(() => parseClientEnv({ EXPO_PUBLIC_ENV: 'development' })).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL/,
    );
  });

  it('http:// URL reddedilir', () => {
    expect(() =>
      parseClientEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: 'http://insecure.example.com' }),
    ).toThrow(EnvValidationError);
  });

  it('bilinmeyen ortam adı reddedilir', () => {
    expect(() => parseClientEnv({ ...valid, EXPO_PUBLIC_ENV: 'prod' })).toThrow(EnvValidationError);
  });

  it('isProduction yalnız production için doğrudur', () => {
    expect(isProduction(parseClientEnv({ ...valid, EXPO_PUBLIC_ENV: 'production' }))).toBe(true);
    expect(isProduction(parseClientEnv({ ...valid, EXPO_PUBLIC_ENV: 'staging' }))).toBe(false);
  });
});
