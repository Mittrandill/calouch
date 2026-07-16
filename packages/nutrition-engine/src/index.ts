export {
  ACTIVITY_MULTIPLIER,
  FAT_G_PER_KG_MINIMUM,
  FIBER_G_PER_1000_KCAL,
  GOAL_FORMULA_VERSION,
  KCAL_PER_G,
  KCAL_PER_KG_BODY_FAT,
  MAX_SUSTAINABLE_WEEKLY_CHANGE_KG,
  MIFFLIN_SEX_CONSTANT,
  PROTEIN_G_PER_KG,
  SAFE_MINIMUM_CALORIES,
  WATER_ML_PER_KG,
} from './goals/constants';

export {
  ageFromBirthYear,
  basalMetabolicRate,
  calorieDirection,
  dailyCalorieDelta,
  totalDailyEnergyExpenditure,
} from './goals/energy';

export { macroTargets, referenceWeightKg, waterTargetMl } from './goals/macros';

export {
  calculateGoals,
  GoalInputError,
  requiresProfessionalAdviceNotice,
} from './goals/goalEngine';

export type {
  ActivityLevel,
  BiologicalSex,
  GoalConfidence,
  GoalInput,
  GoalResult,
  GoalWarning,
  MacroTargets,
  PrimaryGoal,
} from './goals/types';
