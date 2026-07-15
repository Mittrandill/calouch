import { PlaceholderScreen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';

/**
 * Bugün ekranı.
 * Kart kataloğu ve düzenlenebilir yerleşim Dalga 1C'de gelir (§02, MVP-11).
 */
export default function TodayScreen() {
  const t = useTranslations();
  return <PlaceholderScreen title={t.tabs.today} subtitle={t.placeholder.today} />;
}
