import { z } from 'zod';

/**
 * PRD §01 kabul kriteri: "Mobil bundle'da Gemini/service-role secret yok."
 * PRD §01: "Environment config ve secret'lar istemci/public değişken ayrımına uyuyor."
 *
 * Bu modül o ayrımı yorum satırı olmaktan çıkarıp çalışma zamanı kapısına
 * çevirir. Mobil kod `process.env`'e doğrudan erişemez (ESLint kuralı);
 * buradan geçmek zorundadır.
 */

/** İstemciye gömülmesine izin verilen anahtarlar. Liste bilinçli olarak kısa. */
const CLIENT_ENV_ALLOWLIST = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_ENV',
] as const;

/**
 * İstemci ortamında bulunması tek başına olay olan desenler.
 * Bir geliştirici `.env`'e service-role anahtarı yapıştırırsa, bu kural onu
 * mağazaya gitmeden önce yakalar.
 */
const FORBIDDEN_CLIENT_PATTERNS = [
  /SERVICE_ROLE/i,
  /GEMINI/i,
  /SECRET/i,
  /PRIVATE_KEY/i,
  /WEBHOOK/i,
] as const;

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const clientEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .refine(isHttpsUrl, 'https:// ile başlayan geçerli bir URL olmalı'),

  // Modern publishable key (sb_publishable_...) veya legacy anon JWT.
  // Her ikisi de public'tir; service-role anahtarı ise ASLA buraya girmez.
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20)
    .refine(
      (v) => v.startsWith('sb_publishable_') || v.startsWith('eyJ'),
      'Publishable key `sb_publishable_` veya legacy anon JWT (`eyJ`) olmalı',
    )
    .refine(
      (v) => !v.includes('service_role'),
      'Bu bir service-role anahtarı. §01: istemci bundle\'ına giremez.',
    ),

  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Ham ortam nesnesinden istemci config'ini üretir.
 *
 * Allowlist dışındaki hiçbir değer okunmaz — yani yeni bir `EXPO_PUBLIC_*`
 * eklemek bilinçli bir karar gerektirir.
 */
export function parseClientEnv(source: Record<string, string | undefined>): ClientEnv {
  const leaked = Object.keys(source).filter(
    (key) =>
      key.startsWith('EXPO_PUBLIC_') &&
      FORBIDDEN_CLIENT_PATTERNS.some((pattern) => pattern.test(key)),
  );

  if (leaked.length > 0) {
    throw new EnvValidationError(
      `PRD §01 ihlali: secret görünümlü değişken istemci ortamında bulundu: ${leaked.join(', ')}. ` +
        'Bu değerler Edge Function / server secret olarak tutulur.',
    );
  }

  const picked: Record<string, string | undefined> = {};
  for (const key of CLIENT_ENV_ALLOWLIST) {
    picked[key] = source[key];
  }

  const result = clientEnvSchema.safeParse(picked);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(kök)'}: ${issue.message}`)
      .join('\n');
    throw new EnvValidationError(`Ortam değişkenleri geçersiz:\n${detail}`);
  }

  return result.data;
}

export const isProduction = (env: ClientEnv): boolean => env.EXPO_PUBLIC_ENV === 'production';
