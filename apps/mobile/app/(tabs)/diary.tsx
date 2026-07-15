import { PlaceholderScreen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';

/** Günlük. Manuel öğün ve su Dalga 1B'de gelir (§03, MVP-05). */
export default function DiaryScreen() {
  const t = useTranslations();
  return <PlaceholderScreen title={t.tabs.diary} subtitle={t.placeholder.diary} />;
}
