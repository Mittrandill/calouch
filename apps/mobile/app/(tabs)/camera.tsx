import { PlaceholderScreen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';

/**
 * AI Kamera.
 *
 * Ürünün ana farklılaştırıcısı (§00) ama Dalga 1C'ye aittir: fotoğraftan
 * analiz, 1B'deki besin kataloğu ve deterministik nutrition engine'in üstüne
 * kurulur (§04, §11 "AI kalori motoru 1B'nin üstüne kurulur").
 *
 * Kamera izni burada İSTENMEZ; §00 gereği izin bağlamsal olarak, kullanıcı
 * eylemi anında istenir.
 */
export default function CameraScreen() {
  const t = useTranslations();
  return <PlaceholderScreen title={t.tabs.camera} subtitle={t.placeholder.today} />;
}
