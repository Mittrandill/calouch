import type { AnalyticsEvent, EventName } from './events';
import { EVENT_ALLOWLIST } from './events';
import { assertClean, SensitiveAnalyticsError } from './redaction';

export * from './events';
export { findViolations, SensitiveAnalyticsError, type Violation } from './redaction';

/** Olayı bir sağlayıcıya ileten taşıma katmanı. */
export type AnalyticsTransport = {
  send(name: EventName, props: Record<string, unknown>): void;
};

export type AnalyticsOptions = {
  transport: AnalyticsTransport;
  /**
   * PRD §09: analitik açık rızaya bağlıdır ve reddedilse de uygulama çalışır.
   * Rıza yokken olaylar kuyruklanmaz, düşürülür — sonradan "rıza verilince
   * gönderelim" davranışı geri çekilen rızayı delerdi.
   */
  hasConsent: () => boolean;
  /**
   * Geliştirmede ihlal fırlatır (hatayı erken gör), production'da olayı sessizce
   * düşürür — analitik kuralı yüzünden kullanıcının uygulaması çökemez.
   */
  throwOnViolation: boolean;
};

export class Analytics {
  constructor(private readonly options: AnalyticsOptions) {}

  track(event: AnalyticsEvent): void {
    if (!this.options.hasConsent()) return;

    if (!EVENT_ALLOWLIST.includes(event.name)) {
      this.handleViolation(
        new SensitiveAnalyticsError(`Katalog dışı olay: '${event.name}'`),
      );
      return;
    }

    const props = event.props as Record<string, unknown>;

    try {
      assertClean(event.name, props);
    } catch (error) {
      this.handleViolation(error);
      return;
    }

    this.options.transport.send(event.name, props);
  }

  private handleViolation(error: unknown): void {
    if (this.options.throwOnViolation) throw error;
    // Production: olayı düşür. Hata mesajı payload içermez (§09 log redaction).
    console.warn('[analytics] olay düşürüldü:', (error as Error).message);
  }
}

/** Rıza yokken veya test ortamında kullanılan boş taşıma. */
export const noopTransport: AnalyticsTransport = { send: () => {} };
