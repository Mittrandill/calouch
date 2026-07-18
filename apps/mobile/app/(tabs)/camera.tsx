import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { MealDraftReview } from '@/camera/MealDraftReview';
import { Screen } from '@/components/Screen';
import { useAnalyzeMealPhoto, type AnalyzeMealPhotoResult } from '@/data/aiMealAnalysis';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * AI Kamera — MVP-09 job pipeline'ını üretir, MVP-10 taslağı düzenlenebilir/
 * onaylanabilir hale getirir (bkz. `@/camera/MealDraftReview`).
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
  const [lastUri, setLastUri] = useState<string | null>(null);

  // NOT: taslak ekranı görünürken (`reanalyze`) `result` BİLİNÇLİ olarak
  // hemen temizlenmez — MealDraftReview aynı jobId'ye kadar ekranda kalır,
  // yalnız "yeniden analiz" butonu `isReanalyzing` ile pasifleşir. Yeni
  // fotoğraf seçiminde (`pick`) ise önce sıfırlanır (eski taslak kalıntısı
  // görünmesin).
  const analyze = async (uri: string) => {
    try {
      const analysis = await analyzePhoto.mutateAsync({ uri });
      setResult(analysis);
    } catch {
      setResult({ ok: false, code: 'generic', message: t.camera.errors.generic });
    }
  };

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
    setLastUri(asset.uri);
    await analyze(asset.uri);
  };

  // "Yeniden analiz": kullanıcı kamera/galeriyi tekrar açmaz — aynı yerel
  // fotoğraf URI'siyle useAnalyzeMealPhoto tekrar tetiklenir (hook zaten her
  // çağrıda yeni operationId/storagePath üretiyor, bkz. aiMealAnalysis.ts).
  const reanalyze = () => {
    if (lastUri !== null) void analyze(lastUri);
  };

  const discard = () => {
    setResult(null);
    setLastUri(null);
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

      {analyzePhoto.isPending && result === null && (
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

      {result !== null && result.ok && (
        <MealDraftReview
          // Yeni bir job/taslak (ör. "yeniden analiz" sonrası) bileşeni
          // sıfırdan mount eder — düzenleme state'i eski taslağa ait kalmaz.
          key={result.jobId}
          draft={result.result}
          onReanalyze={reanalyze}
          isReanalyzing={analyzePhoto.isPending}
          onDiscard={discard}
          onSaved={() => {
            discard();
            router.push('/(tabs)/diary');
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonRow: { flexDirection: 'row' },
  actionButton: { alignItems: 'center', justifyContent: 'center' },
});
