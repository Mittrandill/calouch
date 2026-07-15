/**
 * Çalışma zamanı savunma hattı.
 *
 * Tip sistemi (`events.ts`) asıl kapıdır; burası `as any`, JS'ten çağrı veya
 * gelecekteki bir refactor tipi delerse diye ikinci hattır. PRD §09:
 * "Loglara medya, token, API key, parola, tam sağlık kaydı veya tam AI
 * konuşması yazılmaz."
 */

/** Sağlık/kimlik çağrıştıran alan adları. Ad bazlı, çünkü değer her şey olabilir. */
const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /weight/i,
  /kilo/i,
  /height/i,
  /boy/i,
  /calorie|kalori/i,
  /macro|protein|carb|fat/i,
  /birth|dob|age|yas/i,
  /email|eposta/i,
  /phone|telefon/i,
  /name|isim|ad$/i,
  /password|sifre|şifre/i,
  /token|jwt|api[_-]?key|secret/i,
  /photo|image|media|uri|url/i,
  /note|allergy|alerji/i,
  /message|prompt|transcript/i,
  /address|adres|location|lat|lng/i,
];

/** Değer bazlı desenler: alan adı masum olsa da içerik ele verir. */
const SENSITIVE_VALUE_PATTERNS: readonly RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // e-posta
  /^eyJ[\w-]+\./, // JWT
  /^sb_secret_/i,
  /^(data:|file:|content:|https?:)/i, // medya/URI
  /\b\d{11}\b/, // TC kimlik uzunluğunda sayı dizisi
];

export class SensitiveAnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SensitiveAnalyticsError';
  }
}

export type Violation = { key: string; rule: 'key' | 'value' | 'type' };

/**
 * Payload'u denetler. Boş dizi = temiz.
 *
 * Serbest metin, tanım gereği reddedilir: kategorik olmayan bir string'in
 * kullanıcı verisi taşımadığını garanti edemeyiz.
 */
export function findViolations(props: Record<string, unknown>): Violation[] {
  const violations: Violation[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      violations.push({ key, rule: 'key' });
      continue;
    }

    if (typeof value === 'string') {
      if (SENSITIVE_VALUE_PATTERNS.some((p) => p.test(value))) {
        violations.push({ key, rule: 'value' });
        continue;
      }
      // Kategorik değerler kısadır ('invalid_credentials' gibi). Uzun string
      // serbest metindir ve gizlilik açısından denetlenemez.
      if (value.length > 64) {
        violations.push({ key, rule: 'value' });
      }
      continue;
    }

    if (value !== null && typeof value === 'object') {
      // İç içe nesne, denetimi zorlaştırır ve sağlık kaydı taşımanın en kolay
      // yoludur. Katalog düz payload kullanır.
      violations.push({ key, rule: 'type' });
    }
  }

  return violations;
}

export function assertClean(name: string, props: Record<string, unknown>): void {
  const violations = findViolations(props);
  if (violations.length > 0) {
    const detail = violations.map((v) => `${v.key} (${v.rule})`).join(', ');
    throw new SensitiveAnalyticsError(
      `PRD §02 ihlali: '${name}' olayı hassas veri taşıyor: ${detail}. ` +
        'Analitik payload yalnız kategorik değer taşır.',
    );
  }
}
