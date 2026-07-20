import { Redirect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import {
  useDeleteProgressPhoto,
  useProgressPhotos,
  useUploadProgressPhoto,
  type PhotoAngle,
  type ProgressPhotoWithUrl,
} from '@/data/progressPhotos';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useBiometricGate, useBiometricLockPreference } from '@/measurements/useBiometricLock';
import { useTheme } from '@/theme/ThemeProvider';

const ANGLES: PhotoAngle[] = ['front', 'side', 'back'];

/** §05 "İlerleme fotoğrafları" — MVP-07. */
export default function ProgressPhotosScreen() {
  const theme = useTheme();
  const { isAuthenticated, isRestoring } = useAuth();
  const lockPreference = useBiometricLockPreference();
  const gate = useBiometricGate(lockPreference.enabled);

  if (isRestoring || lockPreference.isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  if (lockPreference.enabled && !gate.isUnlocked) {
    return <LockGate error={gate.error} isAuthenticating={gate.isAuthenticating} onRetry={gate.retry} />;
  }

  return (
    <PhotosContent
      lockEnabled={lockPreference.enabled}
      setLockEnabled={(value) => void lockPreference.setPreference(value)}
    />
  );
}

function LockGate({
  error,
  isAuthenticating,
  onRetry,
}: {
  error: string | null;
  isAuthenticating: boolean;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <Screen>
      <View style={styles.center}>
        {isAuthenticating ? (
          <ActivityIndicator color={theme.colors.brand.text} />
        ) : (
          <>
            {error !== null && (
              <Text
                accessibilityRole="alert"
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.status.danger, marginBottom: theme.spacing.md, textAlign: 'center' },
                ]}
              >
                {error}
              </Text>
            )}
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={t.progressPhotos.lock.unlock}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  minHeight: theme.minTouchTarget,
                  paddingHorizontal: theme.spacing.xl,
                  borderRadius: theme.radius.md,
                  backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
                },
              ]}
            >
              <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
                {t.progressPhotos.lock.unlock}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

function PhotosContent({
  lockEnabled,
  setLockEnabled,
}: {
  lockEnabled: boolean;
  setLockEnabled: (value: boolean) => void;
}) {
  const theme = useTheme();
  const t = useTranslations();

  const photos = useProgressPhotos();
  const uploadPhoto = useUploadProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();

  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    if (selectedAngle === null) return;

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset === undefined) return;

    setUploadError(null);
    try {
      await uploadPhoto.mutateAsync({ uri: asset.uri, angle: selectedAngle });
      setSelectedAngle(null);
    } catch {
      setUploadError(t.progressPhotos.error);
    }
  };

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {t.progressPhotos.title}
      </Text>

      <Pressable
        onPress={() => setLockEnabled(!lockEnabled)}
        accessibilityRole="switch"
        accessibilityState={{ checked: lockEnabled }}
        accessibilityLabel={t.progressPhotos.lock.enable}
        style={({ pressed }) => [
          styles.rowHeader,
          {
            minHeight: theme.minTouchTarget,
            marginTop: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.md,
            backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
          {t.progressPhotos.lock.enable}
        </Text>
        <Text style={[theme.typography.body, { color: lockEnabled ? theme.colors.brand.text : theme.colors.text.tertiary }]}>
          {lockEnabled ? '✓' : ''}
        </Text>
      </Pressable>

      <View
        style={[
          styles.card,
          {
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border.default,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
          ]}
        >
          {t.progressPhotos.chooseAngle}
        </Text>

        <View style={[styles.angleRow, { gap: theme.spacing.sm }]}>
          {ANGLES.map((angle) => (
            <Pressable
              key={angle}
              onPress={() => setSelectedAngle(angle)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedAngle === angle, checked: selectedAngle === angle }}
              accessibilityLabel={t.progressPhotos.angle[angle]}
              style={({ pressed }) => [
                styles.chip,
                {
                  minHeight: theme.minTouchTarget,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.full,
                  borderColor:
                    selectedAngle === angle ? theme.colors.brand.text : theme.colors.border.default,
                  backgroundColor:
                    selectedAngle === angle
                      ? theme.colors.brand.subtle
                      : pressed
                        ? theme.colors.surface.pressed
                        : theme.colors.surface.default,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: selectedAngle === angle ? theme.colors.brand.text : theme.colors.text.primary },
                ]}
              >
                {t.progressPhotos.angle[angle]}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedAngle !== null && (
          <View style={[styles.angleRow, { marginTop: theme.spacing.md, gap: theme.spacing.sm }]}>
            <Pressable
              onPress={() => void pick('camera')}
              disabled={uploadPhoto.isPending}
              accessibilityRole="button"
              accessibilityLabel={t.progressPhotos.takePhoto}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  flex: 1,
                  minHeight: theme.minTouchTarget,
                  borderRadius: theme.radius.md,
                  backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
                  opacity: uploadPhoto.isPending ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
                {t.progressPhotos.takePhoto}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void pick('library')}
              disabled={uploadPhoto.isPending}
              accessibilityRole="button"
              accessibilityLabel={t.progressPhotos.chooseFromLibrary}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  flex: 1,
                  minHeight: theme.minTouchTarget,
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border.default,
                  backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
                  opacity: uploadPhoto.isPending ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[theme.typography.label, { color: theme.colors.text.primary }]}>
                {t.progressPhotos.chooseFromLibrary}
              </Text>
            </Pressable>
          </View>
        )}

        {uploadPhoto.isPending && (
          <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.md }} />
        )}

        {uploadError !== null && (
          <Text
            accessibilityRole="alert"
            style={[
              theme.typography.bodySm,
              { color: theme.colors.status.danger, marginTop: theme.spacing.sm },
            ]}
          >
            {uploadError}
          </Text>
        )}
      </View>

      {photos.isPending && (
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xl }} />
      )}

      {photos.data !== undefined && photos.data.length === 0 && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xl, textAlign: 'center' },
          ]}
        >
          {t.progressPhotos.empty}
        </Text>
      )}

      <View style={[styles.grid, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        {photos.data?.map((photo) => (
          <PhotoCell key={photo.id} photo={photo} onDelete={() => deletePhoto.mutate(photo)} />
        ))}
      </View>
    </Screen>
  );
}

function PhotoCell({ photo, onDelete }: { photo: ProgressPhotoWithUrl; onDelete: () => void }) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <View style={styles.cell}>
      <Image
        source={{ uri: photo.signedUrl }}
        style={[styles.cellImage, { borderRadius: theme.radius.md }]}
      />
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.text.secondary, marginTop: theme.spacing.xxs },
        ]}
      >
        {t.progressPhotos.angle[photo.angle as 'front' | 'side' | 'back']}
      </Text>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={t.progressPhotos.remove}
        hitSlop={theme.spacing.sm}
        style={[
          styles.deleteBadge,
          {
            top: theme.spacing.xs,
            right: theme.spacing.xs,
            width: theme.spacing.xl,
            height: theme.spacing.xl,
            backgroundColor: theme.colors.status.dangerSurface,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Text style={{ color: theme.colors.status.danger }}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  angleRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '31%', position: 'relative' },
  cellImage: { width: '100%', aspectRatio: 3 / 4 },
  deleteBadge: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
