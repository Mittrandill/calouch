import { describe, expect, it } from 'vitest';

import { redact } from './reportError';

/**
 * PRD §09: "Loglara medya, token, API key, parola, tam sağlık kaydı veya tam
 * AI konuşması yazılmaz."
 */
describe('redact', () => {
  it('JWT maskeler', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.abc-def_123';
    expect(redact(`token: ${jwt}`)).toBe('token: [jwt]');
  });

  it('Supabase anahtarlarını maskeler', () => {
    expect(redact('key=sb_publishable_d5HmKhGJC0XJj5PSXnh3GQ_A2aUY0NX')).toBe(
      'key=[supabase-key]',
    );
    expect(redact('sb_secret_abc123')).toBe('[supabase-key]');
  });

  it('e-posta maskeler', () => {
    expect(redact('Kullanıcı ali.veli+test@example.com giriş yapamadı')).toBe(
      'Kullanıcı [email] giriş yapamadı',
    );
  });

  it('medya URI maskeler', () => {
    expect(redact('Yükleme hatası: file:///var/mobile/meal-2026.jpg')).toBe(
      'Yükleme hatası: [media-uri]',
    );
    expect(redact('data:image/jpeg;base64,/9j/4AAQSkZJRg')).toBe('[media-uri]');
  });

  it('Authorization başlığı maskeler', () => {
    expect(redact('Authorization: Bearer abc.def.ghi')).toBe('Authorization: Bearer [redacted]');
  });

  it('şifre alanını maskeler', () => {
    expect(redact('{"password":"hunter2"}')).toBe('{"password":[redacted]}');
    expect(redact('sifre=hunter2')).toBe('sifre=[redacted]');
  });

  it('aynı metinde birden çok sırrı maskeler', () => {
    const input = 'ali@example.com için sb_secret_xyz ile file:///a.jpg yüklenemedi';
    const output = redact(input);
    expect(output).not.toContain('ali@example.com');
    expect(output).not.toContain('sb_secret_xyz');
    expect(output).not.toContain('file:///a.jpg');
  });

  it('zararsız metni değiştirmez', () => {
    expect(redact('Ağ bağlantısı kurulamadı (timeout 30s)')).toBe(
      'Ağ bağlantısı kurulamadı (timeout 30s)',
    );
  });
});
