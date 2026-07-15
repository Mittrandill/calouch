import * as SecureStore from 'expo-secure-store';

/**
 * PRD §09: "SecureStore: token/küçük secret."
 *
 * Sorun: SecureStore değer başına ~2048 baytla sınırlıdır (Android
 * SharedPreferences/Keystore kaynaklı). Supabase oturumu access token +
 * refresh token + user nesnesi taşır ve bu sınırı rahatlıkla aşar. Sınır
 * aşıldığında yazma sessizce başarısız olur; kullanıcı uygulamayı her
 * açtığında yeniden giriş yapmak zorunda kalır ve sebebi görünmez.
 *
 * Çözüm: değeri parçalara böl, parça sayısını ayrı bir anahtarda tut.
 * Oturumu AsyncStorage'a taşımak daha kolay olurdu ama orası şifrelenmemiş
 * disktir — §09 bunu token için kabul etmez.
 */

/** 2048'in altında güvenli pay: UTF-8'de çok baytlı karakterler için marj. */
const CHUNK_SIZE = 1536;

const chunkKey = (key: string, index: number) => `${key}.${index}`;
const countKey = (key: string) => `${key}.count`;

/**
 * SecureStore anahtarları yalnız alfanumerik, '.', '-' ve '_' kabul eder.
 * Supabase anahtarları ('sb-<ref>-auth-token') bu kümeye uyar; yine de
 * gelecekteki bir anahtar bozulmasın diye normalize edilir.
 */
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const largeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    const rawCount = await SecureStore.getItemAsync(countKey(base));
    if (rawCount === null) return null;

    const count = Number.parseInt(rawCount, 10);
    if (!Number.isInteger(count) || count < 1) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(base, i))),
    );

    // Eksik parça = bozuk kayıt. Yarım oturum döndürmek, geçersiz token'la
    // sonsuz yeniden deneme döngüsüne yol açar; null daha dürüst.
    if (chunks.some((chunk) => chunk === null)) {
      await largeSecureStore.removeItem(key);
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);

    // Yeni değer daha az parça tutuyorsa, eskiden kalan parçalar okumada
    // yanlış birleşmeye yol açardı.
    await largeSecureStore.removeItem(key);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(base, index), chunk)),
    );
    // Sayaç en son yazılır: yarıda kesilen yazma, tamamlanmış gibi okunmaz.
    await SecureStore.setItemAsync(countKey(base), String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key);
    const rawCount = await SecureStore.getItemAsync(countKey(base));

    // Önce sayaç silinir: kalan parçalar sahipsiz kalsa bile okunmazlar.
    await SecureStore.deleteItemAsync(countKey(base));

    const count = rawCount === null ? 0 : Number.parseInt(rawCount, 10);
    if (!Number.isInteger(count) || count < 1) return;

    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(base, i))),
    );
  },
};
