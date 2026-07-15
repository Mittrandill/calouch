import { PlaceholderScreen } from '@/components/Screen';
import { useTranslations } from '@/i18n/LocaleProvider';

/** Antrenman. Faz 2'ye ait (§06, TRN-*); sekme mimaride şimdiden yerini tutar. */
export default function TrainingScreen() {
  const t = useTranslations();
  return <PlaceholderScreen title={t.tabs.training} subtitle={t.placeholder.training} />;
}
