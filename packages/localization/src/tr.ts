/**
 * Türkçe, kaynak dildir. `en.ts` bu nesnenin şeklini birebir karşılamak
 * zorundadır — eksik anahtar derleme hatasıdır.
 */
export const tr = {
  common: {
    cancel: 'İptal',
    save: 'Kaydet',
    retry: 'Tekrar dene',
    loading: 'Yükleniyor',
    error: 'Bir şeyler ters gitti',
  },
  tabs: {
    today: 'Bugün',
    diary: 'Günlük',
    camera: 'AI Kamera',
    training: 'Antrenman',
    profile: 'Profil',
  },
  // §02: "Ortadaki kamera aksiyonu görsel olarak ayrışır." Ekran okuyucu
  // kullanıcısı bu ayrımı göremez; etiket farkı taşımalı.
  a11y: {
    cameraAction: 'AI Kamera ile öğün analiz et',
    tabSelected: 'seçili',
  },
  auth: {
    signInTitle: 'Tekrar hoş geldin',
    signUpTitle: 'Calouch\'a başla',
    email: 'E-posta',
    password: 'Şifre',
    signIn: 'Giriş yap',
    signUp: 'Kayıt ol',
    signOut: 'Çıkış yap',
    forgotPassword: 'Şifremi unuttum',
    noAccount: 'Hesabın yok mu?',
    hasAccount: 'Zaten hesabın var mı?',
    continueWithGoogle: 'Google ile devam et',
    continueWithApple: 'Apple ile devam et',
    magicLink: 'E-posta ile bağlantı gönder',
    checkEmail: 'Doğrulama bağlantısı için e-postanı kontrol et',
  },
  authError: {
    invalidCredentials: 'E-posta veya şifre hatalı',
    emailInUse: 'Bu e-posta zaten kayıtlı',
    weakPassword: 'Şifre en az 8 karakter olmalı',
    invalidEmail: 'Geçerli bir e-posta gir',
    // §12: ağ hatası kullanıcıya suç yüklemeden anlatılır.
    network: 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.',
    rateLimited: 'Çok fazla deneme. Biraz bekleyip tekrar dene.',
    unknown: 'Giriş yapılamadı. Tekrar dene.',
  },
  settings: {
    title: 'Ayarlar',
    appearance: 'Görünüm',
    language: 'Dil',
    theme: {
      system: 'Sistem',
      light: 'Açık',
      dark: 'Koyu',
      oled: 'OLED siyah',
    },
  },
  placeholder: {
    // Dalga 1A iskelet ekranları. 1B/1C'de gerçek içerikle değişir.
    today: 'Bugün ekranı 1C dalgasında gelecek',
    diary: 'Günlük 1B dalgasında gelecek',
    training: 'Antrenman Faz 2\'de gelecek',
  },
};

// `as const` bilinçli olarak YOK: değerleri literal'e sabitlerse `Translations`
// tipi "İptal" gibi tek bir metni şart koşar ve en.ts derlenmez. Buradaki amaç
// değerleri değil, ANAHTAR yapısını sabitlemek.
export type Translations = typeof tr;
