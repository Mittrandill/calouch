import { env } from '../env';

/**
 * Web için oturum deposu — YALNIZCA GELİŞTİRME.
 *
 * Web, PRD §00'a göre hedef platform DEĞİL ("Platformlar iOS ve Android").
 * Bu adaptör yalnız `expo start --web` ile tarayıcıda hızlı göz atmak için var.
 *
 * Neden ayrı bir dosya ve neden bu kadar gürültülü:
 * expo-secure-store'un web karşılığı yok (`ExpoSecureStore` = `{}`), yani
 * token'ı tutacak tek yer localStorage. localStorage şifrelenmez ve aynı
 * origin'deki her script okuyabilir — §09'un token için SecureStore şart
 * koşmasının sebebi tam olarak budur.
 *
 * Bu yüzden aşağıdaki kapı var: production ortamında bu modül yüklenirse
 * uygulama açılmaz. Web yolu bir gün yanlışlıkla yayına giderse, sessizce
 * güvensiz çalışmak yerine gürültüyle durur.
 */
if (env.EXPO_PUBLIC_ENV === 'production') {
  throw new Error(
    'PRD §09 ihlali: web oturum deposu production ortamında yüklendi. ' +
      'Web hedef platform değil (§00) ve localStorage token için güvenli değil. ' +
      'Web gerçekten yayınlanacaksa önce §09 kapsamında bir oturum stratejisi kararlaştırılmalı.',
  );
}

export const webDevStorage = {
  getItem(key: string): string | null {
    return globalThis.localStorage?.getItem(key) ?? null;
  },
  setItem(key: string, value: string): void {
    globalThis.localStorage?.setItem(key, value);
  },
  removeItem(key: string): void {
    globalThis.localStorage?.removeItem(key);
  },
};
