import type { OnboardingDraft } from '../types';

export type StepProps = {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  onBack?: () => void;
  currentIndex: number;
  totalSteps: number;
};
