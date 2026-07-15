/**
 * Kapalı analitik olay kataloğu.
 *
 * PRD §02 kabul kriteri: "Hiçbir health/personal değer analitik payload'a girmez."
 * PRD §00 kapsam dışı: "Hassas içeriği analitik olayı veya uygulama loguna koymak."
 *
 * Tasarım kararı: olaylar serbest biçimli değil, birebir sayılmış. Yeni bir
 * olay veya alan eklemek bu dosyayı düzenlemeyi gerektirir; yani gizlilik
 * kararı kod incelemesine düşer. `track('whatever', { weightKg })` yazmak
 * mümkün değildir — derlenmez.
 *
 * Değerler bilinçli olarak kategorik: sayaç, enum ve boolean. Kilo, kalori,
 * makro, e-posta, ad, doğum yılı gibi hiçbir alan burada tanımlı DEĞİLDİR ve
 * tanımlanamaz.
 */

/** §02 navigasyonundaki beş sekme. Ekran adı kategoriktir, içerik taşımaz. */
export type ScreenName =
  | 'today'
  | 'diary'
  | 'camera'
  | 'training'
  | 'profile'
  | 'settings'
  | 'sign_in'
  | 'sign_up';

export type AuthMethod = 'email' | 'google' | 'apple' | 'magic_link';

/** Hata *sınıfı*. Sunucu mesajı veya kullanıcı girdisi asla gönderilmez. */
export type AuthFailureReason =
  | 'invalid_credentials'
  | 'email_in_use'
  | 'weak_password'
  | 'invalid_email'
  | 'network'
  | 'rate_limited'
  | 'cancelled'
  | 'unknown';

export type ThemeChoice = 'system' | 'light' | 'dark' | 'oled';

export type AnalyticsEvent =
  | { name: 'app_opened'; props: { isColdStart: boolean } }
  | { name: 'screen_viewed'; props: { screen: ScreenName } }
  | { name: 'auth_started'; props: { method: AuthMethod } }
  | { name: 'auth_completed'; props: { method: AuthMethod; isNewUser: boolean } }
  | { name: 'auth_failed'; props: { method: AuthMethod; reason: AuthFailureReason } }
  | { name: 'session_restored'; props: { durationMs: number } }
  | { name: 'signed_out'; props: Record<string, never> }
  | { name: 'theme_changed'; props: { theme: ThemeChoice } }
  | { name: 'language_changed'; props: { locale: 'tr' | 'en' } };

export type EventName = AnalyticsEvent['name'];

/** Katalogda kayıtlı olay adları — çalışma zamanı savunması için. */
export const EVENT_ALLOWLIST: readonly EventName[] = [
  'app_opened',
  'screen_viewed',
  'auth_started',
  'auth_completed',
  'auth_failed',
  'session_restored',
  'signed_out',
  'theme_changed',
  'language_changed',
] as const;
