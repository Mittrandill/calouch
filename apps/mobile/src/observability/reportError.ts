/**
 * Hata raporlama sınırı.
 *
 * PRD §09: "Loglara medya, token, API key, parola, tam sağlık kaydı veya tam
 * AI konuşması yazılmaz."
 *
 * Şu an konsola yazar. Sentry (veya eşdeğeri) bağlanması FND-01'in kalan
 * işidir ve `deliver` fonksiyonunu değiştirmekle sınırlıdır — çağrı yerleri
 * ve redaksiyon kuralı aynı kalır. Sağlayıcı seçimi 14-open-decisions.md'de.
 */

/** Mesaj/stack içinde geçtiğinde maskelenecek desenler. */
const REDACTION_PATTERNS: readonly { pattern: RegExp; replacement: string }[] = [
  { pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[jwt]' },
  { pattern: /sb_(publishable|secret)_[A-Za-z0-9_-]+/g, replacement: '[supabase-key]' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]+/g, replacement: '[email]' },
  { pattern: /(data|file|content):[^\s"']+/g, replacement: '[media-uri]' },
  { pattern: /Bearer\s+[A-Za-z0-9._-]+/gi, replacement: 'Bearer [redacted]' },
  { pattern: /("?(?:password|sifre|şifre)"?\s*[:=]\s*)("[^"]*"|\S+)/gi, replacement: '$1[redacted]' },
];

export function redact(text: string): string {
  return REDACTION_PATTERNS.reduce(
    (acc, { pattern, replacement }) => acc.replace(pattern, replacement),
    text,
  );
}

export type ErrorContext = {
  /** React bileşen yığını. Kullanıcı verisi taşımaz. */
  componentStack?: string;
  /** Kategorik etiket — serbest metin değil. */
  scope?: 'auth' | 'render' | 'network' | 'storage';
};

function deliver(name: string, message: string, stack: string | undefined, context: ErrorContext) {
  // TODO(FND-01): Sentry adapter. Redaksiyon burada değil, çağrıdan ÖNCE
  // yapılır ki sağlayıcı ham veriyi hiç görmesin.
  console.error(`[${context.scope ?? 'app'}] ${name}: ${message}`, {
    stack,
    componentStack: context.componentStack,
  });
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));

  deliver(
    err.name,
    redact(err.message),
    err.stack === undefined ? undefined : redact(err.stack),
    {
      ...context,
      componentStack:
        context.componentStack === undefined ? undefined : redact(context.componentStack),
    },
  );
}
