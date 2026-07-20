import { router } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import mealBreakfastImage from '../../../assets/decorative/meal-breakfast.png';
import mealDinnerImage from '../../../assets/decorative/meal-dinner.png';
import mealLunchImage from '../../../assets/decorative/meal-lunch.png';
import mealSnackImage from '../../../assets/decorative/meal-snack.png';
import { Card, type CardSize } from '@/components/Card';
import { useTodaysMeals, type MealType } from '@/data/meals';
import { useSignedPhotoUrl } from '@/data/storage';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Öğün türüne göre dekoratif fallback — kalıcı fotoğrafı olmayan (manuel
 * öğün) veya henüz gerçek fotoğrafı yüklenmemiş kayıtlarda kullanılır.
 * `pre_workout`/`post_workout`/`night`/`custom` için fitpulsev1'de eşleşen
 * bir kategori yok, genel bir görsele düşer.
 */
const MEAL_TYPE_FALLBACK_IMAGES: Record<MealType, ImageSourcePropType> = {
  breakfast: mealBreakfastImage,
  lunch: mealLunchImage,
  dinner: mealDinnerImage,
  snack: mealSnackImage,
  pre_workout: mealSnackImage,
  post_workout: mealSnackImage,
  night: mealSnackImage,
  custom: mealSnackImage,
};

/** §9 "Son öğün" — `useTodaysMeals` zaten en yeniden eskiye sıralı döner. */
export function LastMealCard({ size, focusBadge }: { size: CardSize; focusBadge?: React.ReactNode }) {
  const theme = useTheme();
  const t = useTranslations();
  const today = new Date();

  const meals = useTodaysMeals(today);
  const lastMeal = meals.data?.[0];
  const signedPhoto = useSignedPhotoUrl('ai-meal-photos', lastMeal?.photoStoragePath);

  // Gerçek fotoğraf varsa onu bekle (yüklenene kadar fallback'e ATLAMA —
  // aksi hâlde fallback→gerçek foto arasında görsel flaş olur). Fotoğraf
  // hiç yoksa (manuel öğün) doğrudan dekoratif fallback'e geç.
  const backgroundImage: ImageSourcePropType | undefined =
    lastMeal === undefined
      ? undefined
      : signedPhoto.data !== undefined
        ? { uri: signedPhoto.data }
        : lastMeal.photoStoragePath === null
          ? MEAL_TYPE_FALLBACK_IMAGES[lastMeal.mealType]
          : undefined;
  const textColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.primary;
  const secondaryTextColor =
    backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.secondary;

  return (
    <Card title={t.today.cards.lastMeal.title} trailing={focusBadge} size={size} backgroundImage={backgroundImage}>
      {meals.isPending ? (
        <ActivityIndicator color={theme.colors.brand.text} />
      ) : lastMeal === undefined ? (
        <Text style={[theme.typography.bodySm, { color: theme.colors.text.tertiary }]}>
          {t.today.cards.lastMeal.empty}
        </Text>
      ) : (
        <Pressable
          onPress={() => router.push('/(tabs)/diary')}
          accessibilityRole="button"
          accessibilityLabel={t.diary.title}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[theme.typography.body, { color: textColor }]}>
              {lastMeal.mealType === 'custom'
                ? (lastMeal.customLabel ?? '')
                : t.diary.mealTypes[lastMeal.mealType]}
            </Text>
            <Text style={[theme.typography.numericSm, { color: secondaryTextColor }]}>
              {Math.round(lastMeal.items.reduce((sum, item) => sum + item.energyKcal, 0))} {t.diary.calories}
            </Text>
          </View>
        </Pressable>
      )}
    </Card>
  );
}
