import type { Json } from '@calouch/types';

import type { CardSize } from '@/components/Card';
import { useProfile, useUpdateProfile } from '@/data/profile';
import { useIsOnline } from '@/data/useIsOnline';

import {
  DEFAULT_CARD_ORDER,
  DEFAULT_FOCUS_CARD_ID,
  getCardDefinition,
  isDashboardCardId,
  type DashboardCardDefinition,
  type DashboardCardId,
} from './cardCatalog';

export type DashboardLayout = {
  cardOrder: DashboardCardId[];
  hiddenCardIds: DashboardCardId[];
  cardSizes: Partial<Record<DashboardCardId, CardSize>>;
  focusCardId: DashboardCardId;
};

const DEFAULT_LAYOUT: DashboardLayout = {
  cardOrder: [...DEFAULT_CARD_ORDER],
  hiddenCardIds: [],
  cardSizes: {},
  focusCardId: DEFAULT_FOCUS_CARD_ID,
};

/**
 * Sunucudan gelen serbest şekilli jsonb'yi (yalnız obje şekli DB'de
 * CHECK'lenir, bkz. migration) güvenli bir `DashboardLayout`'a çevirir.
 * Bilinmeyen/eski kart id'leri elenir; kayıtlı yerleşimde olmayan yeni
 * katalog id'leri sona eklenir — yeni kart tipi eklendiğinde migration
 * gerektirmez, mevcut kullanıcı bir sonraki açılışta yeni kartı sırada görür.
 */
function parseDashboardLayout(raw: Json): DashboardLayout {
  const source: Record<string, unknown> =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {};

  const storedOrder = Array.isArray(source.cardOrder) ? source.cardOrder.filter(isDashboardCardId) : [];
  const missingIds = DEFAULT_CARD_ORDER.filter((id) => !storedOrder.includes(id));
  const cardOrder = [...storedOrder, ...missingIds];

  const hiddenCardIds = Array.isArray(source.hiddenCardIds)
    ? source.hiddenCardIds.filter(isDashboardCardId)
    : [];

  const cardSizes: Partial<Record<DashboardCardId, CardSize>> = {};
  if (typeof source.cardSizes === 'object' && source.cardSizes !== null) {
    for (const [key, value] of Object.entries(source.cardSizes as Record<string, unknown>)) {
      if (!isDashboardCardId(key)) continue;
      if (value !== 'compact' && value !== 'expanded') continue;
      if (!getCardDefinition(key).supportedSizes.includes(value)) continue;
      cardSizes[key] = value;
    }
  }

  const focusCardId =
    isDashboardCardId(source.focusCardId) && !hiddenCardIds.includes(source.focusCardId)
      ? source.focusCardId
      : DEFAULT_FOCUS_CARD_ID;

  return { cardOrder, hiddenCardIds, cardSizes, focusCardId };
}

function serializeDashboardLayout(layout: DashboardLayout): Json {
  return {
    version: 1,
    cardOrder: layout.cardOrder,
    hiddenCardIds: layout.hiddenCardIds,
    cardSizes: layout.cardSizes,
    focusCardId: layout.focusCardId,
  } as unknown as Json;
}

/**
 * Bugün ekranı kart yerleşimi (§9, MVP-11). Yazma yolu mevcut
 * `useUpdateProfile()` — `goal_overrides`/`theme_preference` ile AYNI çağrı
 * deseni, yeni RPC yok. §09 "Ayarlarda last-write-wins".
 */
export function useDashboardLayout() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const isOnline = useIsOnline();

  const layout =
    profile.data !== undefined ? parseDashboardLayout(profile.data.dashboard_layout) : DEFAULT_LAYOUT;

  const allCardsInOrder: DashboardCardDefinition[] = layout.cardOrder.map(getCardDefinition);
  const visibleOrderedCards = allCardsInOrder.filter((card) => !layout.hiddenCardIds.includes(card.id));
  const focusCard = visibleOrderedCards.find((card) => card.id === layout.focusCardId);

  function updateLayout(next: DashboardLayout) {
    updateProfile.mutate({ dashboard_layout: serializeDashboardLayout(next) });
  }

  return {
    isLoading: profile.isPending,
    isError: profile.isError,
    // Profil sorgusu offline'da persisted cache'ten gelir (queryClient.ts) —
    // ağ yoksa "hata" değil "offline" gösterilir (kabul kriteri).
    isOffline: !isOnline && profile.data !== undefined,
    layout,
    allCardsInOrder,
    visibleOrderedCards,
    focusCard,
    updateLayout,
    isSaving: updateProfile.isPending,
  };
}
