import { parseClientEnv, type ClientEnv } from '@calouch/config';

/**
 * Uygulamanın ortam değişkenlerine açılan TEK kapısı.
 * ESLint, başka her yerde `process.env` erişimini reddeder (PRD §01).
 *
 * DİKKAT — burada `process.env`'i olduğu gibi geçmek çalışmaz:
 * Metro yalnızca `process.env.EXPO_PUBLIC_X` biçimindeki STATİK erişimleri
 * derleme sırasında değerle değiştirir. `process.env` nesnesini bütün olarak
 * geçmek veya `process.env[key]` yazmak production bundle'ında undefined
 * verir; hata yalnız gerçek build'de ortaya çıkar, geliştirmede çıkmaz.
 * Bu yüzden her değişken tek tek, açıkça yazılır.
 */
const raw = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
};

/**
 * Uygulama açılışında doğrulanır. Eksik/yanlış config sessizce çalışan bir
 * uygulamaya değil, açık bir hataya dönüşür.
 */
export const env: ClientEnv = parseClientEnv(raw);
