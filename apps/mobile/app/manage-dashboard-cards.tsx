import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import type { CardSize } from '@/components/Card';
import type { DashboardCardDefinition, DashboardCardId } from '@/dashboard/cardCatalog';
import { useDashboardLayout } from '@/dashboard/useDashboardLayout';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Kartları Düzenle (§9, MVP-11): görünürlük/sıra/boyut/odak kartı.
 *
 * Sürükle-bırak yerine buton tabanlı sıralama — yeni native bağımlılık
 * (reanimated/gesture-handler) gerektirmez ve ekran okuyucu için sürükleme
 * jestinden daha erişilebilir (kabul kriteri: "kart düzenleme erişilebilir",
 * bkz. 14-open-decisions.md). Her etkileşim `updateLayout()`'u hemen çağırır
 * — `useLogMeasurement` ile aynı desen, ayrı bir "kaydet" adımı yok.
 */
export default function ManageDashboardCardsScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring } = useAuth();
  const { isLoading, layout, allCardsInOrder, updateLayout } = useDashboardLayout();

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

  function toggleVisible(id: DashboardCardId) {
    const isHidden = layout.hiddenCardIds.includes(id);
    const hiddenCardIds = isHidden
      ? layout.hiddenCardIds.filter((cardId) => cardId !== id)
      : [...layout.hiddenCardIds, id];

    // Odak kartı gizlenirse, hâlâ görünür olan bir sonraki karta geçer —
    // aksi hâlde "günlük odak kartı" kullanıcıya görünmeyen bir şeyi işaret eder.
    const focusCardId =
      !isHidden && layout.focusCardId === id
        ? (layout.cardOrder.find((cardId) => cardId !== id && !hiddenCardIds.includes(cardId)) ?? id)
        : layout.focusCardId;

    updateLayout({ ...layout, hiddenCardIds, focusCardId });
  }

  function moveCard(id: DashboardCardId, direction: -1 | 1) {
    const index = layout.cardOrder.indexOf(id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= layout.cardOrder.length) return;

    const cardOrder = [...layout.cardOrder];
    [cardOrder[index], cardOrder[targetIndex]] = [cardOrder[targetIndex]!, cardOrder[index]!];
    updateLayout({ ...layout, cardOrder });
  }

  function setSize(id: DashboardCardId, size: CardSize) {
    updateLayout({ ...layout, cardSizes: { ...layout.cardSizes, [id]: size } });
  }

  function setFocus(id: DashboardCardId) {
    updateLayout({ ...layout, focusCardId: id });
  }

  return (
    <Screen scrollable edges={{ top: true, bottom: true }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.heading, { color: theme.colors.text.primary }]}
      >
        {t.dashboardManage.title}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xl }} />
      ) : (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          {allCardsInOrder.map((card, index) => (
            <CardRow
              key={card.id}
              card={card}
              isHidden={layout.hiddenCardIds.includes(card.id)}
              isFocus={layout.focusCardId === card.id}
              size={layout.cardSizes[card.id] ?? card.defaultSize}
              canMoveUp={index > 0}
              canMoveDown={index < allCardsInOrder.length - 1}
              onToggleVisible={() => toggleVisible(card.id)}
              onMoveUp={() => moveCard(card.id, -1)}
              onMoveDown={() => moveCard(card.id, 1)}
              onSetSize={(size) => setSize(card.id, size)}
              onSetFocus={() => setFocus(card.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CardRow({
  card,
  isHidden,
  isFocus,
  size,
  canMoveUp,
  canMoveDown,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  onSetSize,
  onSetFocus,
}: {
  card: DashboardCardDefinition;
  isHidden: boolean;
  isFocus: boolean;
  size: CardSize;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleVisible: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetSize: (size: CardSize) => void;
  onSetFocus: () => void;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const title = t.today.cards[card.id].title;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface.default,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.md,
          opacity: isHidden ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.rowHeader}>
        <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <IconButton
            name="chevron-up"
            disabled={!canMoveUp}
            accessibilityLabel={t.dashboardManage.moveUp}
            onPress={onMoveUp}
          />
          <IconButton
            name="chevron-down"
            disabled={!canMoveDown}
            accessibilityLabel={t.dashboardManage.moveDown}
            onPress={onMoveDown}
          />
          <Switch
            value={!isHidden}
            onValueChange={onToggleVisible}
            accessibilityLabel={isHidden ? t.dashboardManage.hidden : t.dashboardManage.visible}
            trackColor={{ true: theme.colors.brand.default, false: theme.colors.border.strong }}
          />
        </View>
      </View>

      {!isHidden && (
        <View
          style={[
            styles.rowFooter,
            { marginTop: theme.spacing.sm, gap: theme.spacing.sm },
          ]}
        >
          {card.supportedSizes.length > 1 && (
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              {card.supportedSizes.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => onSetSize(option)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    option === 'compact' ? t.dashboardManage.sizeCompact : t.dashboardManage.sizeExpanded
                  }
                  style={[
                    styles.chip,
                    {
                      minHeight: theme.minTouchTarget,
                      paddingHorizontal: theme.spacing.sm,
                      borderRadius: theme.radius.full,
                      borderColor: size === option ? theme.colors.brand.text : theme.colors.border.default,
                      backgroundColor:
                        size === option ? theme.colors.brand.subtle : theme.colors.surface.default,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: size === option ? theme.colors.brand.text : theme.colors.text.secondary },
                    ]}
                  >
                    {option === 'compact' ? t.dashboardManage.sizeCompact : t.dashboardManage.sizeExpanded}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            onPress={onSetFocus}
            disabled={isFocus}
            accessibilityRole="button"
            accessibilityLabel={isFocus ? t.dashboardManage.isFocus : t.dashboardManage.setFocus}
            style={[
              styles.chip,
              {
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radius.full,
                borderColor: isFocus ? theme.colors.brand.text : theme.colors.border.default,
                backgroundColor: isFocus ? theme.colors.brand.subtle : theme.colors.surface.default,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: isFocus ? theme.colors.brand.text : theme.colors.text.secondary },
              ]}
            >
              {isFocus ? t.dashboardManage.isFocus : t.dashboardManage.setFocus}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function IconButton({
  name,
  disabled,
  accessibilityLabel,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        minWidth: theme.minTouchTarget,
        minHeight: theme.minTouchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <Ionicons name={name} size={20} color={theme.colors.text.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { borderWidth: StyleSheet.hairlineWidth },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
