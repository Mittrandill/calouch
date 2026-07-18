import type { CardSize } from '@/components/Card';

/**
 * Bugün ekranı kart kataloğu (§9, MVP-11).
 *
 * PRD'nin 6 madde bülleti (kalori+aktif enerji, makrolar, su+adım, son
 * öğün+antrenman, ölçü trendi+seri+challenge, AI değerlendirme) burada 11
 * bağımsız yönetilebilir karta açılıyor — "kart kataloğu" ifadesinin doğal
 * okuması, her kartın bağımsız gizlenip boyutlandırılabilmesi (bkz.
 * 14-open-decisions.md).
 *
 * `hasRealData: false` olan kartların veri kaynağı henüz yok (bkz. tablodaki
 * bağımlılık) — gövdede `ComingSoonCard` gösterilir, uydurma sayı YOK.
 */
export type DashboardCardId =
  | 'calorie'
  | 'macros'
  | 'water'
  | 'lastMeal'
  | 'measurementTrend'
  | 'activeEnergy'
  | 'steps'
  | 'todayWorkout'
  | 'streak'
  | 'challenge'
  | 'aiInsight';

export type DashboardCardDefinition = {
  id: DashboardCardId;
  hasRealData: boolean;
  /** Veri kaynağı yoksa hangi işe bağlı olduğu — yalnız yönetim ekranında gösterilir. */
  pendingOn?: string;
  supportedSizes: CardSize[];
  defaultSize: CardSize;
};

export const DASHBOARD_CARD_CATALOG: readonly DashboardCardDefinition[] = [
  { id: 'calorie', hasRealData: true, supportedSizes: ['compact', 'expanded'], defaultSize: 'expanded' },
  { id: 'macros', hasRealData: true, supportedSizes: ['compact', 'expanded'], defaultSize: 'compact' },
  { id: 'water', hasRealData: true, supportedSizes: ['compact', 'expanded'], defaultSize: 'compact' },
  { id: 'lastMeal', hasRealData: true, supportedSizes: ['compact'], defaultSize: 'compact' },
  {
    id: 'measurementTrend',
    hasRealData: true,
    supportedSizes: ['compact', 'expanded'],
    defaultSize: 'compact',
  },
  {
    id: 'activeEnergy',
    hasRealData: false,
    pendingOn: 'MVP-12',
    supportedSizes: ['compact'],
    defaultSize: 'compact',
  },
  { id: 'steps', hasRealData: false, pendingOn: 'MVP-12', supportedSizes: ['compact'], defaultSize: 'compact' },
  {
    id: 'todayWorkout',
    hasRealData: false,
    pendingOn: 'TRN-*',
    supportedSizes: ['compact'],
    defaultSize: 'compact',
  },
  { id: 'streak', hasRealData: false, supportedSizes: ['compact'], defaultSize: 'compact' },
  { id: 'challenge', hasRealData: false, supportedSizes: ['compact'], defaultSize: 'compact' },
  {
    id: 'aiInsight',
    hasRealData: false,
    pendingOn: 'COACH-*',
    supportedSizes: ['compact', 'expanded'],
    defaultSize: 'compact',
  },
] as const;

export const DEFAULT_CARD_ORDER: readonly DashboardCardId[] = DASHBOARD_CARD_CATALOG.map((c) => c.id);

export const DEFAULT_FOCUS_CARD_ID: DashboardCardId = 'calorie';

export function isDashboardCardId(value: unknown): value is DashboardCardId {
  return typeof value === 'string' && DASHBOARD_CARD_CATALOG.some((card) => card.id === value);
}

export function getCardDefinition(id: DashboardCardId): DashboardCardDefinition {
  // Katalogdaki her id için bir tanım vardır — `find`'ın `undefined` dönmesi
  // yalnız `id` katalog dışıysa mümkündür, ki tip zaten bunu engeller.
  return DASHBOARD_CARD_CATALOG.find((card) => card.id === id)!;
}
