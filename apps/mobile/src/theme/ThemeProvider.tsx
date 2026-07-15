import {
  colorSchemes,
  minTouchTarget,
  radius,
  resolveTheme,
  shadows,
  spacing,
  typography,
  type ColorScheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@calouch/design-tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const STORAGE_KEY = 'calouch.theme-preference';

export type Theme = {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  minTouchTarget: number;
  /** Çözümlenmiş tema — `system` burada görünmez. */
  resolved: ResolvedTheme;
  isDark: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePreference = (value: string): value is ThemePreference =>
  ['system', 'light', 'dark', 'oled'].includes(value);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useColorScheme cihaz görünümü değiştiğinde yeniden render tetikler; §02
  // "yeniden başlatmadan değişir" şartı buna dayanır.
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Tercih diskten okunana kadar 'system' gösterilir. §02 tercihin kalıcı ve
  // cihazlar arası senkron olmasını istiyor; hesaba yazma MVP-02'de profile
  // tablosuna bağlanır, o zamana kadar yerel kalıcılık yeterli.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && stored !== null && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Okunamayan tercih hata değil: varsayılan 'system' ile devam edilir.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    // Önce state: kullanıcı diskin yazılmasını beklemez.
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = resolveTheme(preference, systemScheme);
    return {
      preference,
      setPreference,
      theme: {
        colors: colorSchemes[resolved],
        spacing,
        radius,
        shadows,
        typography,
        minTouchTarget,
        resolved,
        isDark: resolved !== 'light',
      },
    };
  }, [preference, systemScheme, setPreference]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const context = use(ThemeContext);
  if (context === null) {
    throw new Error('useTheme, ThemeProvider içinde çağrılmalı');
  }
  return context.theme;
}

export function useThemePreference() {
  const context = use(ThemeContext);
  if (context === null) {
    throw new Error('useThemePreference, ThemeProvider içinde çağrılmalı');
  }
  return { preference: context.preference, setPreference: context.setPreference };
}
