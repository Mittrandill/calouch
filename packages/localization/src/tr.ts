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
  // §8.2 adımlı onboarding. §02: "Onboarding yarıda kalınca devam eder;
  // izin reddi bloklamaz." Adımların çoğu atlanabilir.
  onboarding: {
    back: 'Geri',
    next: 'Devam et',
    skip: 'Atla',
    saving: 'Kaydediliyor',

    name: {
      title: 'Sana nasıl seslenelim?',
      subtitle: 'İstersen bu adımı atlayabilirsin.',
      placeholder: 'Ad veya rumuz',
    },

    unit: {
      title: 'Birim sistemi',
      subtitle: 'Boy ve kiloyu hangi birimle gireceksin?',
      metric: 'Metrik (cm, kg)',
      imperial: 'İngiliz (ft/in, lb)',
    },

    birthYear: {
      title: 'Doğum yılın nedir?',
      subtitle: 'Günlük enerji ihtiyacını hesaplamak için gerekli.',
      placeholder: 'Örn. 1996',
    },

    height: {
      title: 'Boyun nedir?',
      placeholderCm: 'cm',
      placeholderFeet: 'ft',
      placeholderInches: 'in',
    },

    weight: {
      title: 'Mevcut ve hedef kilon',
      current: 'Mevcut kilo',
      target: 'Hedef kilo',
      placeholderKg: 'kg',
      placeholderLb: 'lb',
    },

    sex: {
      title: 'Biyolojik cinsiyet',
      subtitle:
        'Yalnızca kalori hesabının doğruluğu için kullanılır; atlarsan yaklaşık bir değerle devam ederiz.',
      male: 'Erkek',
      female: 'Kadın',
      skip: 'Belirtmek istemiyorum',
    },

    activity: {
      title: 'Aktivite seviyen nedir?',
      sedentary: 'Hareketsiz',
      sedentaryHint: 'Masa başı iş, planlı egzersiz yok',
      light: 'Hafif aktif',
      lightHint: 'Haftada 1-3 gün hafif egzersiz',
      moderate: 'Orta aktif',
      moderateHint: 'Haftada 3-5 gün orta egzersiz',
      active: 'Aktif',
      activeHint: 'Haftada 6-7 gün egzersiz',
      veryActive: 'Çok aktif',
      veryActiveHint: 'Günde iki antrenman veya fiziksel iş',
    },

    goal: {
      title: 'Ana hedefin nedir?',
      loseWeight: 'Kilo vermek',
      gainWeight: 'Kilo almak',
      maintainWeight: 'Kiloyu korumak',
      buildMuscle: 'Kas geliştirmek',
      eatHealthy: 'Sağlıklı beslenmek',
      increaseActivity: 'Aktiviteyi artırmak',
      trainingRoutine: 'Antrenman düzeni oluşturmak',
      improveMeasurements: 'Vücut ölçülerini geliştirmek',
    },

    pace: {
      title: 'Haftalık hedef değişim',
      subtitle: 'Ne kadar hızlı ilerlemek istersin?',
      perWeek: 'kg/hafta',
      tooFastWarning: 'Bu hız sürdürülebilir aralığın üzerinde; yine de devam edebilirsin.',
    },

    diet: {
      title: 'Beslenme tercihin',
      subtitle: 'İstersen bu adımı atlayabilirsin.',
      omnivore: 'Hepçil',
      vegetarian: 'Vejetaryen',
      vegan: 'Vegan',
      pescatarian: 'Pesketaryen',
      other: 'Diğer',
      mealsPerDayLabel: 'Günde kaç öğün?',
    },

    summary: {
      title: 'Günlük hedeflerin hazır',
      subtitle: 'Tüm değerleri istediğin zaman elle değiştirebilirsin.',
      calories: 'Kalori',
      protein: 'Protein',
      carbs: 'Karbonhidrat',
      fat: 'Yağ',
      fiber: 'Lif',
      water: 'Su',
      lowConfidenceNote:
        'Biyolojik cinsiyet belirtilmediği için bu tahmin yaklaşıktır; elle ayarlayabilirsin.',
      warningBelowSafeMinimum:
        'Hesaplanan hedef güvenli alt sınırın altındaydı; sınıra yükseltildi.',
      warningBelowBmr: 'Bu hedef, bazal metabolizmanın altında kalıyor.',
      warningTooFast: 'Seçtiğin haftalık hız sürdürülebilir aralığın üzerinde.',
      professionalAdviceNotice:
        'Bu derece düşük bir hedefte bir sağlık uzmanına danışmanı öneririz. Calouch tıbbi tavsiye vermez.',
      finish: 'Başla',
    },

    validation: {
      required: 'Bu alan gerekli',
      outOfRange: 'Değer beklenen aralığın dışında',
    },
  },
};

// `as const` bilinçli olarak YOK: değerleri literal'e sabitlerse `Translations`
// tipi "İptal" gibi tek bir metni şart koşar ve en.ts derlenmez. Buradaki amaç
// değerleri değil, ANAHTAR yapısını sabitlemek.
export type Translations = typeof tr;
