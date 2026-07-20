import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type CardSize = 'compact' | 'expanded';

type CardProps = {
  title?: string;
  /** Başlığın yanına, sağa hizalı ikincil içerik (ör. rozet, kısa değer). */
  trailing?: ReactNode;
  size?: CardSize;
  children: ReactNode;
  /**
   * Kartın arkasına tam kaplayan fotoğraf + alttan okunurluk gradyanı
   * (tasarım dili yenilemesi, 2026-07-20). Verilirse başlık rengi otomatik
   * `text.onMedia`'ya döner — İÇERİK'teki (children) metin renklerini
   * çağıran kendi seçmelidir, `Card` bunu bilemez.
   */
  backgroundImage?: ImageSourcePropType;
};

/**
 * Paylaşımlı kart kabuğu (MVP-11).
 *
 * `diary.tsx`/`profile.tsx`'teki inline kart stilinin (`SummaryCard`,
 * `Section`) ilk paylaşımlı çıkarımı — Bugün ekranı 11 kart render ettiği
 * için tekrar burada anlamlı hâle geldi. Eski ekranlar bu işte refactor
 * edilmedi (kapsam dışı).
 */
export function Card({ title, trailing, size = 'compact', children, backgroundImage }: CardProps) {
  const theme = useTheme();
  const titleColor = backgroundImage !== undefined ? theme.colors.text.onMedia : theme.colors.text.primary;

  const header = (title !== undefined || trailing !== undefined) && (
    <View style={[styles.header, { marginBottom: theme.spacing.sm }]}>
      {title !== undefined && (
        <Text
          style={[
            size === 'expanded' ? theme.typography.heading : theme.typography.headingSm,
            { color: titleColor },
          ]}
        >
          {title}
        </Text>
      )}
      {trailing}
    </View>
  );

  if (backgroundImage !== undefined) {
    return (
      <View
        style={[
          styles.card,
          styles.photoCard,
          {
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border.default,
            minHeight: size === 'expanded' ? 200 : 160,
          },
        ]}
      >
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          imageStyle={{ borderRadius: theme.radius.lg }}
        />
        <LinearGradient
          colors={['transparent', theme.colors.background.media]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.photoContent, { padding: size === 'expanded' ? theme.spacing.xl : theme.spacing.lg }]}>
          {header}
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border.default,
          padding: size === 'expanded' ? theme.spacing.xl : theme.spacing.lg,
        },
      ]}
    >
      {header}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoCard: { overflow: 'hidden', justifyContent: 'flex-end' },
  photoContent: { justifyContent: 'flex-end', flexGrow: 1 },
});
