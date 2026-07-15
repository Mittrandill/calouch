import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * expo-secure-store native modül; testte bellek içi bir sahte ile değiştirilir.
 * Amaç, PARÇALAMA mantığını sınamak — native katmanı değil.
 */
const store = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    // Gerçek SecureStore ~2048 baytta başarısız olur. Sahte de olsun ki
    // parçalama bozulursa test kırılsın, sessizce geçmesin.
    if (value.length > 2048) throw new Error('SecureStore sınırı aşıldı');
    store.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

const { largeSecureStore } = await import('./secureStorage');

beforeEach(() => store.clear());

describe('largeSecureStore', () => {
  it('küçük değeri yazar ve okur', async () => {
    await largeSecureStore.setItem('k', 'merhaba');
    expect(await largeSecureStore.getItem('k')).toBe('merhaba');
  });

  it('olmayan anahtar için null döner', async () => {
    expect(await largeSecureStore.getItem('yok')).toBeNull();
  });

  /** Asıl mesele: gerçek bir Supabase oturumu 2048 baytı aşar. */
  it('2048 bayt sınırını aşan değeri parçalayarak saklar', async () => {
    const session = 'x'.repeat(9000);
    await largeSecureStore.setItem('sb-auth-token', session);

    expect(await largeSecureStore.getItem('sb-auth-token')).toBe(session);
    // Hiçbir tekil parça sınırı aşmamalı.
    for (const value of store.values()) {
      expect(value.length).toBeLessThanOrEqual(2048);
    }
  });

  it('parçalama sınırında doğru çalışır', async () => {
    for (const size of [1535, 1536, 1537, 3072, 3073]) {
      const value = 'a'.repeat(size);
      await largeSecureStore.setItem('k', value);
      expect(await largeSecureStore.getItem('k'), `boyut ${size}`).toBe(value);
    }
  });

  it('çok baytlı karakterleri bozmadan saklar', async () => {
    const value = 'çğıöşü'.repeat(500);
    await largeSecureStore.setItem('k', value);
    expect(await largeSecureStore.getItem('k')).toBe(value);
  });

  it('uzun değerin yerine kısa değer yazınca artık parça kalmaz', async () => {
    // Eski parçalar kalsaydı okuma sırasında yanlış birleşme olurdu.
    await largeSecureStore.setItem('k', 'y'.repeat(6000));
    await largeSecureStore.setItem('k', 'kısa');

    expect(await largeSecureStore.getItem('k')).toBe('kısa');
    expect([...store.keys()].filter((key) => key.startsWith('k.')).length).toBe(2); // .0 + .count
  });

  it('silme sonrası hiçbir parça kalmaz', async () => {
    await largeSecureStore.setItem('k', 'z'.repeat(5000));
    await largeSecureStore.removeItem('k');

    expect(await largeSecureStore.getItem('k')).toBeNull();
    expect(store.size).toBe(0);
  });

  it('parça eksikse null döner ve bozuk kaydı temizler', async () => {
    await largeSecureStore.setItem('k', 'w'.repeat(5000));
    store.delete('k.1'); // bozulma

    expect(await largeSecureStore.getItem('k')).toBeNull();
    // Yarım oturum bırakmak, geçersiz token'la yeniden deneme döngüsü üretir.
    expect(store.size).toBe(0);
  });

  it('geçersiz karakterli anahtarı normalize eder', async () => {
    await largeSecureStore.setItem('sb:auth@token', 'v');
    expect(await largeSecureStore.getItem('sb:auth@token')).toBe('v');
  });
});
