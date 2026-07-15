# AI Hoca ve Form Analizi

## Yazılı AI hoca

Görevler: günlük/haftalık özet, makro açıklaması, beslenme/antrenman plan taslağı, egzersiz alternatifi, set/dinlenme yönetimi, ölçü trendi, alışveriş listesi ve tarif önerisi.

AI yalnızca kullanıcının erişebildiği veriyi görür. Sağlık sınırları sistem talimatı, tool authorization ve çıktı moderasyonunda birlikte uygulanır.

## Tool calling

İzin verilen örnek araçlar: current workout, önceki performans, set log/update, rest timer, skip/replace exercise, günlük beslenme özeti, su log, meal draft, ölçü trendi ve workout finish.

Kurallar:

- Her tool server tarafından şema ile doğrulanır.
- Kullanıcı/job/session sahipliği yeniden kontrol edilir.
- Model hiçbir zaman doğrudan DB yetkisi almaz.
- Veri değiştiren kritik çağrı açık kullanıcı onayı ister.
- Tool call ve sonuç özeti audit edilebilir; hassas ham konuşma loglanmaz.

## Sesli AI hoca

Birincil: backend'den kısa ömürlü ephemeral token ile Gemini Live bağlantısı. Preview bağımlılığı nedeniyle fallback: STT -> text model -> function calling -> TTS.

Ham ses varsayılan saklanmaz, kalıcı dosya oluşturulmaz, yalnızca yapılandırılmış işlem özeti tutulur. Tam konuşma geçmişi opt-in'dir ve silinebilir. Sessizlik timeout'u ve dakika kotası uygulanır.

## Plan üretimi

Beslenme girdileri hedefler, tercihler, alerji, sevilen/sevilmeyen, öğün sayısı, bütçe, hazırlama süresi, mutfak ve antrenman günleridir. Antrenman girdileri hedef, deneyim, gün/süre, ekipman, kullanıcının bildirdiği kısıtlar, tercih, geçmiş performans ve dinlenmedir.

Her iki çıktı da sürümlü taslak olur; kullanıcı onayından sonra aktifleşir.

## Cihaz içi form takibi

```text
Camera -> native frame processor -> MediaPipe Pose Landmarker
       -> exercise state machine -> angle/rep analysis -> local feedback
```

Ham kamera sunucuya gönderilmez. Sunucuya yalnızca tekrar, açı özeti, tempo, skor, hata kodu ve güven gönderilebilir. Ham landmark kareleri oturum bitince silinir.

İlk hareketler: squat, lunge, push-up, plank, shoulder press, biceps curl, lateral raise, Romanian deadlift, jumping jack ve sit-up.

Her hareket ayrı state machine, görünür landmark gereksinimi, açı eşikleri, debounce/hysteresis ve confidence eşiği taşır. Aynı anda çok sayıda geri bildirim verilmez.

## Güvenlik dili

`Formun kusursuz`, `sakatlanmazsın` veya görünmeyen ekleme dair kesin yargı kullanılmaz. Düşük güven açıkça belirtilir. Ağrı bildiren kullanıcı devam etmeye yönlendirilmez.

## Video analizi

İleri faz: egzersiz/açı yönergesi, kısa kayıt, cihaz içi pose, opsiyonel landmark paylaşımı, form motoru + Gemini açıklaması ve timestamp raporu. Orijinal video varsayılan kalıcı değildir.

## Kabul kriterleri

- Tool authorization model çıktısından bağımsız server'da uygulanır.
- Kritik mutation onaysız çalışmaz ve idempotenttir.
- Live token kısa ömürlü, kullanıcı/kota bağlı ve secret içermeyen yapıdadır.
- Ham ses/kamera/landmark varsayılan saklanmaz.
- Her pose hareketi doğru/hatalı tekrar, açı, ışık, beden/kıyafet ve kısmi görünürlük datasetinde ölçülür.
- Düşük confidence tekrar veya kesin form hükmü üretmez.
- Preview Live hizmeti kapalıyken fallback veya özellik kapatma kontrollü çalışır.

