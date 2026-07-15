import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Sekme ikonu.
 *
 * İkon adları ürün diline sabitlenir ('today', 'diary'), Ionicons adlarına
 * değil: ikon seti değişirse tek yer güncellenir.
 */
export type IconName = 'today' | 'diary' | 'training' | 'profile';

const ICONS: Record<IconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  today: { active: 'today', inactive: 'today-outline' },
  diary: { active: 'book', inactive: 'book-outline' },
  training: { active: 'barbell', inactive: 'barbell-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

type Props = {
  name: IconName;
  /** RN'in ColorValue'su; platform bazlı opak renk nesnesi de olabilir. */
  color: React.ComponentProps<typeof Ionicons>['color'];
  focused: boolean;
  size?: number;
};

export function TabBarIcon({ name, color, focused, size = 24 }: Props) {
  const glyph = ICONS[name];
  return (
    <Ionicons
      name={focused ? glyph.active : glyph.inactive}
      size={size}
      color={color}
      // Ekran okuyucu sekme adını Tabs'tan zaten alır; ikonun ayrıca
      // seslendirilmesi aynı bilgiyi iki kez okutur.
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
