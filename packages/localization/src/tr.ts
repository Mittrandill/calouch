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
    comingSoon: 'Yakında',
    offline: 'Çevrimdışısın — son bilinen veriler gösteriliyor',
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
    training: 'Antrenman Faz 2\'de gelecek',
  },
  // §9 Bugün ekranı — kart kataloğu (MVP-11). `hasRealData: false` kartlar
  // (bkz. cardCatalog.ts) `comingSoon.description` gösterir, uydurma veri
  // YOK — bkz. 14-open-decisions.md.
  today: {
    title: 'Bugün',
    manageCards: 'Kartları düzenle',
    focusBadge: 'Bugünün odağı',
    allCardsHidden: 'Tüm kartlar gizli. Düzenlemek için dokun.',
    errorBanner: 'Veriler yüklenemedi',
    cards: {
      calorie: {
        title: 'Kalori',
        remaining: 'kalan',
        consumed: 'tüketilen',
        noTarget: 'Hedef henüz belirlenmedi',
      },
      macros: {
        title: 'Makrolar',
        protein: 'Protein',
        carbs: 'Karbonhidrat',
        fat: 'Yağ',
      },
      water: {
        title: 'Su',
      },
      lastMeal: {
        title: 'Son öğün',
        empty: 'Bugün henüz öğün kaydetmedin',
      },
      measurementTrend: {
        title: 'Ölçü trendi',
        empty: 'Henüz ölçü kaydın yok',
        latestWeight: 'Son kilo',
      },
      activeEnergy: {
        title: 'Aktif enerji',
        description: 'Sağlık entegrasyonu (MVP-12) geldiğinde burada görünecek',
      },
      steps: {
        title: 'Adım',
        description: 'Sağlık entegrasyonu (MVP-12) geldiğinde burada görünecek',
      },
      todayWorkout: {
        title: 'Bugünkü antrenman',
        description: 'Antrenman modülü geldiğinde burada görünecek',
      },
      streak: {
        title: 'Seri',
        description: 'Bu özellik yakında geliyor',
      },
      challenge: {
        title: 'Challenge',
        description: 'Bu özellik yakında geliyor',
      },
      aiInsight: {
        title: 'AI kısa değerlendirme',
        description: 'AI hoca geldiğinde burada görünecek',
      },
    },
  },
  dashboardManage: {
    title: 'Kartları düzenle',
    visible: 'Görünür',
    hidden: 'Gizli',
    moveUp: 'Yukarı taşı',
    moveDown: 'Aşağı taşı',
    size: 'Boyut',
    sizeCompact: 'Kompakt',
    sizeExpanded: 'Geniş',
    setFocus: 'Bugünün odağı yap',
    isFocus: 'Bugünün odağı',
  },
  // §03 manuel öğün kaydı.
  diary: {
    title: 'Günlük',
    addMeal: 'Öğün ekle',
    empty: 'Bugün henüz öğün kaydetmedin',
    calories: 'kalori',
    mealTypes: {
      breakfast: 'Kahvaltı',
      snack: 'Ara öğün',
      lunch: 'Öğle',
      dinner: 'Akşam',
      pre_workout: 'Antrenman öncesi',
      post_workout: 'Antrenman sonrası',
      night: 'Gece',
      custom: 'Diğer',
    },
    search: {
      title: 'Ne yedin?',
      placeholder: 'Besin ara',
      empty: 'Sonuç bulunamadı',
      hint: 'Aramak için en az 2 karakter yaz',
    },
    quantity: {
      title: 'Ne kadar?',
      gramsLabel: 'Gram',
      mealTypeLabel: 'Öğün türü',
      save: 'Kaydet',
      saving: 'Kaydediliyor',
    },
    error: {
      save: 'Öğün kaydedilemedi. Tekrar dene.',
    },
    water: {
      title: 'Su',
      unit: 'ml',
      customAmount: 'Özel miktar',
      customAmountLabel: 'Miktar (ml)',
      add: 'Ekle',
      error: 'Su kaydedilemedi. Tekrar dene.',
    },
    fromRecipe: {
      servingsQuestion: 'Kaç porsiyon?',
    },
    favorites: {
      title: 'Favorilerim',
    },
  },
  // §03 tarifler — malzeme+gram+porsiyon, öğüne ekleme.
  recipes: {
    title: 'Tariflerim',
    empty: 'Henüz tarifin yok',
    newRecipe: 'Yeni tarif',
    perServing: 'porsiyon başı',
    builder: {
      titleNew: 'Yeni tarif',
      titleEdit: 'Tarifi düzenle',
      nameLabel: 'Tarif adı',
      namePlaceholder: 'ör. Tavuklu salata',
      servingsLabel: 'Porsiyon sayısı',
      ingredientsTitle: 'Malzemeler',
      addIngredient: 'Malzeme ekle',
      searchPlaceholder: 'Malzeme ara',
      removeIngredient: 'Kaldır',
      save: 'Tarifi kaydet',
      error: 'Tarif kaydedilemedi. Tekrar dene.',
      emptyIngredients: 'Henüz malzeme eklenmedi',
      gramsLabel: 'Gram',
    },
  },
  // §05 vücut ölçüleri ve ilerleme fotoğrafları.
  measurements: {
    title: 'Ölçülerim',
    addMeasurement: 'Ölçü ekle',
    empty: 'Henüz ölçü kaydın yok',
    weightTrend: 'Kilo trendi',
    photosLink: 'İlerleme fotoğrafları',
    moreFields: 'Diğer ölçüler',
    save: 'Kaydet',
    error: 'Ölçü kaydedilemedi. Tekrar dene.',
    fields: {
      weightKg: 'Kilo (kg)',
      heightCm: 'Boy (cm)',
      bodyFatPct: 'Yağ oranı (%)',
      muscleMassKg: 'Kas kütlesi (kg)',
      neckCm: 'Boyun (cm)',
      shoulderCm: 'Omuz (cm)',
      chestCm: 'Göğüs (cm)',
      waistCm: 'Bel (cm)',
      hipCm: 'Kalça (cm)',
      armRightCm: 'Sağ kol (cm)',
      armLeftCm: 'Sol kol (cm)',
      forearmRightCm: 'Sağ ön kol (cm)',
      forearmLeftCm: 'Sol ön kol (cm)',
      thighRightCm: 'Sağ üst bacak (cm)',
      thighLeftCm: 'Sol üst bacak (cm)',
      calfRightCm: 'Sağ baldır (cm)',
      calfLeftCm: 'Sol baldır (cm)',
    },
  },
  progressPhotos: {
    title: 'İlerleme fotoğrafları',
    empty: 'Henüz fotoğraf eklemedin',
    addPhoto: 'Fotoğraf ekle',
    chooseAngle: 'Açı seç',
    takePhoto: 'Fotoğraf çek',
    chooseFromLibrary: 'Galeriden seç',
    remove: 'Sil',
    error: 'Fotoğraf yüklenemedi. Tekrar dene.',
    angle: {
      front: 'Ön',
      side: 'Yan',
      back: 'Arka',
    },
    lock: {
      enable: 'Face ID/parmak izi ile kilitle',
      unlockPrompt: 'İlerleme fotoğraflarını görüntülemek için doğrula',
      unlock: 'Kilidi aç',
      failed: 'Doğrulama başarısız',
      unavailable: 'Cihazında biyometrik doğrulama kullanılamıyor',
    },
  },
  // §04/§10-11 AI fotoğraf analizi. MVP-09 katalog taslağını üretir; MVP-10
  // taslağı düzenlenebilir/onaylanabilir hale getirip log_meal()'e bağlar.
  camera: {
    title: 'AI ile yemek analiz et',
    takePhoto: 'Fotoğraf çek',
    chooseFromLibrary: 'Galeriden seç',
    analyzing: 'Analiz ediliyor…',
    previewNotice:
      'Bu bir taslaktır — değerler eşleşen katalog kayıtlarından hesaplandı. Kaydetmeden önce gözden geçir, gerekirse düzenle.',
    resultTitle: 'Analiz taslağı',
    mealTitleLabel: 'Öğün',
    gramRangeLabel: 'Porsiyon',
    cookingMethodLabel: 'Pişirme yöntemi',
    visibleIngredientsLabel: 'Görünen malzemeler',
    hiddenIngredientsLabel: 'Muhtemel ek malzemeler',
    totalEstimateLabel: 'Toplam tahmin',
    catalogMatchLabel: 'Katalog eşleşmesi',
    catalogNotMatched: 'Katalog eşleşmesi bulunamadı — manuel seçim gerekli',
    proteinLabel: 'protein',
    carbsLabel: 'karb.',
    fatLabel: 'yağ',
    confidence: {
      low: 'Düşük güven',
      medium: 'Orta güven',
      high: 'Yüksek güven',
    },
    // MVP-10: taslak onay/düzenleme ekranı. Gram/öğün türü/arama etiketleri
    // §03'teki `diary.quantity`/`diary.search`/`diary.error` anahtarlarından
    // yeniden kullanılır — burada yalnız bu ekrana özgü metinler yaşar.
    review: {
      lowConfidenceBanner:
        'Bu taslağın genel güveni düşük — kaydetmeden önce kalemleri dikkatle kontrol et.',
      // Katalog eşleşmesi ismen benzer ama muhtemelen yanlış olabilir (ör.
      // "Adana kebap" katalogda yok, "Izgara köfte"ye düşük skorla eşleşir).
      weakMatchWarning: 'Bu eşleşme kesin olmayabilir — yanlışsa "Değiştir"e dokun.',
      change: 'Değiştir',
      itemExcludedNotice: 'Bu kalem kaydedilmeyecek',
      remove: 'Kaldır',
      include: 'Geri ekle',
      searchCatalogPrompt: 'Kataloğdan besin seç',
      confirmAndSave: 'Onayla ve kaydet',
      reanalyze: 'Yeniden analiz et',
      reanalyzing: 'Yeniden analiz ediliyor…',
      discard: 'Vazgeç',
    },
    errors: {
      kill_switch: 'AI fotoğraf analizi geçici olarak kapalı',
      rate_limited: 'Günlük AI fotoğraf analizi limitine ulaştın',
      not_food: 'Fotoğrafta yemek tespit edilemedi',
      provider_error: 'AI sağlayıcısından yanıt alınamadı. Tekrar dene.',
      invalid_response: 'AI yanıtı beklenmeyen biçimde geldi. Tekrar dene.',
      storage_error: 'Fotoğraf işlenemedi. Tekrar dene.',
      provider_not_configured: 'AI fotoğraf analizi şu an kullanılamıyor',
      previously_failed: 'Bu istek daha önce başarısız oldu, yeni bir fotoğrafla tekrar dene',
      job_error: 'Bir şeyler ters gitti. Tekrar dene.',
      processing_error: 'Analiz tamamlanamadı. Tekrar dene.',
      generic: 'Bir şeyler ters gitti. Tekrar dene.',
    },
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
