import type { AuthFailureReason } from '@calouch/analytics';
import type { Translations } from '@calouch/localization';
import { AuthError, isAuthApiError } from '@supabase/supabase-js';

/**
 * Supabase hatasını ürünün kapalı hata sınıflarına indirger.
 *
 * Neden ham mesajı göstermiyoruz:
 * - Sunucu mesajı İngilizce ve teknik ("Invalid login credentials").
 * - §09: sunucu metni loga/analitiğe girmemeli; sınıflandırma girebilir.
 * - Sağlayıcı mesajını değiştirdiğinde UI'nin bozulmaması gerekir.
 */
export function classifyAuthError(error: unknown): AuthFailureReason {
  if (error instanceof Error && error.message === 'cancelled') return 'cancelled';

  if (isAuthApiError(error)) {
    // Supabase'in kararlı kodları; mesaj metnine göre daha güvenilir.
    switch (error.code) {
      case 'invalid_credentials':
      case 'email_not_confirmed':
        return 'invalid_credentials';
      case 'user_already_exists':
      case 'email_exists':
        return 'email_in_use';
      case 'weak_password':
        return 'weak_password';
      case 'validation_failed':
        return 'invalid_email';
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return 'rate_limited';
      default:
        break;
    }

    if (error.status === 429) return 'rate_limited';
    if (error.status === 400) return 'invalid_credentials';
  }

  // AuthRetryableFetchError dahil: ağ katmanı hatası.
  if (error instanceof AuthError && error.name === 'AuthRetryableFetchError') return 'network';
  if (error instanceof TypeError && /network|fetch/i.test(error.message)) return 'network';

  return 'unknown';
}

/** Hata sınıfını kullanıcının dilindeki mesaja çevirir. */
export function authErrorMessage(reason: AuthFailureReason, t: Translations): string {
  switch (reason) {
    case 'invalid_credentials':
      return t.authError.invalidCredentials;
    case 'email_in_use':
      return t.authError.emailInUse;
    case 'weak_password':
      return t.authError.weakPassword;
    case 'invalid_email':
      return t.authError.invalidEmail;
    case 'network':
      return t.authError.network;
    case 'rate_limited':
      return t.authError.rateLimited;
    case 'cancelled':
    case 'unknown':
      return t.authError.unknown;
  }
}
