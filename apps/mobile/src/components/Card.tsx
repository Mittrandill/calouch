import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type CardSize = 'compact' | 'expanded';

type CardProps = {
  title?: string;
  /** Başlığın yanına, sağa hizalı ikincil içerik (ör. rozet, kısa değer). */
  trailing?: ReactNode;
  size?: CardSize;
  children: ReactNode;
};

/**
 * Paylaşımlı kart kabuğu (MVP-11).
 *
 * `diary.tsx`/`profile.tsx`'teki inline kart stilinin (`SummaryCard`,
 * `Section`) ilk paylaşımlı çıkarımı — Bugün ekranı 11 kart render ettiği
 * için tekrar burada anlamlı hâle geldi. Eski ekranlar bu işte refactor
 * edilmedi (kapsam dışı).
 */
export function Card({ title, trailing, size = 'compact', children }: CardProps) {
  const theme = useTheme();

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
      {(title !== undefined || trailing !== undefined) && (
        <View style={[styles.header, { marginBottom: theme.spacing.sm }]}>
          {title !== undefined && (
            <Text
              style={[
                size === 'expanded' ? theme.typography.heading : theme.typography.headingSm,
                { color: theme.colors.text.primary },
              ]}
            >
              {title}
            </Text>
          )}
          {trailing}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
