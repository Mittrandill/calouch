import {
  getTranslations,
  isSupportedLocale,
  resolveLocale,
  type Locale,
  type Translations,
} from '@calouch/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'calouch.locale';

type LocaleContextValue = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  /** Kullanıcı açık seçim yaptı mı, yoksa cihaz dilinde mi? */
  isExplicit: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Cihaz dili. getLocales() senkron çalışır ve ilk render'da hazırdır. */
function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageCode ?? null;
  return resolveLocale(tag);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  const [isExplicit, setIsExplicit] = useState(false);

  // Kullanıcının açık dil seçimi cihaz dilini ezer.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && stored !== null && isSupportedLocale(stored)) {
          setLocaleState(stored);
          setIsExplicit(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setIsExplicit(true);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, isExplicit, setLocale, t: getTranslations(locale) }),
    [locale, isExplicit, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const context = use(LocaleContext);
  if (context === null) {
    throw new Error('useLocale, LocaleProvider içinde çağrılmalı');
  }
  return context;
}

/** Çeviri sözlüğüne kısa erişim. */
export function useTranslations(): Translations {
  return useLocale().t;
}
