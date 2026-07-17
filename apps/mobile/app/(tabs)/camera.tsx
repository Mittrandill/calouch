import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useAnalyzeMealPhoto, type AnalyzeMealPhotoResult } from '@/data/aiMealAnalysis';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * AI Kamera — MVP-08 dilimi.
 *
 * Ürünün ana farklılaştırıcısı (§00) ama bu ekran BİLİNÇLİ olarak bir
 * önizlemedir: Gemini'nin ham aday listesini gösterir, katalog eşleştirme/
 * kalori hesabı ve kaydet aksiyonu YOK (bkz. supabase/functions/
 * analyze-meal-photo/index.ts üstündeki kapsam notu — MVP-09/10'un işi).
 *
 * Kamera izni burada İSTENMEZ; §00 gereği izin bağlamsal olarak, kullanıcı
 * eylemi anında istenir.
 */
export default function CameraScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring } = useAuth();
  const analyzePhoto = useAnalyzeMealPhoto();

  const [result, setResult] = useState<AnalyzeMealPhotoResult | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const pickerResult =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (pickerResult.canceled) return;

    const asset = pickerResult.assets[0];
    if (asset === undefined) return;

    setResult(null);
    try {
      const analysis = await analyzePhoto.mutateAsync({ uri: asset.uri });
      setResult(analysis);
    } catch {
      setResult({ ok: false, code: 'generic', message: t.camera.errors.generic });
    }
  };

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Screen scrollable>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {t.camera.title}
      </Text>

      <View style={[styles.buttonRow, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={() => void pick('camera')}
          disabled={analyzePhoto.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.camera.takePhoto}
          style={({ pressed }) => [
            styles.actionButton,
            {
              flex: 1,
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
              opacity: analyzePhoto.isPending ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            {t.camera.takePhoto}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void pick('library')}
          disabled={analyzePhoto.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.camera.chooseFromLibrary}
          style={({ pressed }) => [
            styles.actionButton,
            {
              flex: 1,
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border.default,
              backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
              opacity: analyzePhoto.isPending ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
            {t.camera.chooseFromLibrary}
          </Text>
        </Pressable>
      </View>

      {analyzePhoto.isPending && (
        <View style={[styles.center, { marginTop: theme.spacing.xxl }]}>
          <ActivityIndicator color={theme.colors.brand.text} />
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
            ]}
          >
            {t.camera.analyzing}
          </Text>
        </View>
      )}

      {result !== null && !result.ok && (
        <Text
          accessibilityRole="alert"
          style={[
            theme.typography.bodySm,
            { color: theme.colors.status.danger, marginTop: theme.spacing.lg, textAlign: 'center' },
          ]}
        >
          {t.camera.errors[result.code as keyof typeof t.camera.errors] ?? result.message}
        </Text>
      )}

      {result !== null && result.ok && result.result.isFood && (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Text
            style={[
              theme.typography.bodySm,
              {
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.lg,
                fontStyle: 'italic',
              },
            ]}
          >
            {t.camera.previewNotice}
          </Text>

          <Text
            accessibilityRole="header"
            style={[theme.typography.headingSm, { color: theme.colors.text.primary }]}
          >
            {t.camera.resultTitle}
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.primary, marginTop: theme.spacing.xs },
            ]}
          >
            {result.result.mealTitle}
          </Text>

          {result.result.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.card,
                {
                  marginTop: theme.spacing.md,
                  backgroundColor: theme.colors.surface.default,
                  borderRadius: theme.radius.md,
                  borderColor: theme.colors.border.default,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
                {item.candidateNames.join(' / ')}
              </Text>
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
                ]}
              >
                {t.camera.gramRangeLabel}: {item.estimatedGrams}g ({item.minGrams}–{item.maxGrams}g)
              </Text>
              {item.cookingMethod !== null && (
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
                  ]}
                >
                  {t.camera.cookingMethodLabel}: {item.cookingMethod}
                </Text>
              )}
              {item.visibleIngredients.length > 0 && (
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.text.tertiary, marginTop: theme.spacing.xxs },
                  ]}
                >
                  {t.camera.visibleIngredientsLabel}: {item.visibleIngredients.join(', ')}
                </Text>
              )}
              {item.possibleHiddenIngredients.length > 0 && (
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.text.tertiary, marginTop: theme.spacing.xxs },
                  ]}
                >
                  {t.camera.hiddenIngredientsLabel}: {item.possibleHiddenIngredients.join(', ')}
                </Text>
              )}
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.brand.text, marginTop: theme.spacing.xs },
                ]}
              >
                {t.camera.confidence[item.confidence]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonRow: { flexDirection: 'row' },
  actionButton: { alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth },
});
