import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { initialDraft, type OnboardingDraft } from './types';

const STORAGE_KEY = 'calouch.onboarding-draft';
const STEP_STORAGE_KEY = 'calouch.onboarding-step';

/**
 * Onboarding taslağını AsyncStorage'da tutar.
 *
 * §02 kabul kriteri: "Onboarding yarıda kalınca devam eder." Kullanıcı
 * profile ismini/e-postasını bilmediğimiz bir noktada (sunucuya henüz hiçbir
 * şey yazılmadan) uygulamayı kapatabilir; bu yüzden taslak SUNUCUDA değil
 * yerelde, adım adım kaydedilir. Yalnız onboarding TAMAMLANDIĞINDA tek bir
 * profil güncellemesiyle sunucuya yazılır (bkz. app/onboarding.tsx).
 *
 * Adım indeksi ayrı bir anahtarda tutulur ki taslak nesnesinin şekli
 * değişse bile (yeni alan eklense) kullanıcı kaldığı yerden devam edebilsin.
 */
export function useOnboardingDraft() {
  const [draft, setDraftState] = useState<OnboardingDraft>(initialDraft);
  const [stepIndex, setStepIndexState] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STEP_STORAGE_KEY),
    ])
      .then(([storedDraft, storedStep]) => {
        if (cancelled) return;
        if (storedDraft !== null) {
          try {
            setDraftState({ ...initialDraft, ...JSON.parse(storedDraft) });
          } catch {
            // Bozuk kayıt: baştan başlamak, kilitlenmiş bir onboarding'den iyidir.
          }
        }
        if (storedStep !== null) {
          const parsed = Number.parseInt(storedStep, 10);
          if (Number.isInteger(parsed) && parsed >= 0) setStepIndexState(parsed);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    // Fonksiyonel güncelleyici: her zaman en güncel state'in üstüne birleşir.
    // Persist yan etkisi kasıtlı olarak burada — updater'ın SONUCU state'e
    // yazılır, AsyncStorage çağrısı yalnızca ateşlenir; render'ı etkilemez.
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setStepIndex = useCallback((index: number) => {
    setStepIndexState(index);
    void AsyncStorage.setItem(STEP_STORAGE_KEY, String(index)).catch(() => {});
  }, []);

  /** Onboarding tamamlanınca taslak silinir; sunucu artık tek doğruluk kaynağı. */
  const clearDraft = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(STEP_STORAGE_KEY),
    ]);
  }, []);

  return { draft, updateDraft, stepIndex, setStepIndex, isRestoring, clearDraft };
}
