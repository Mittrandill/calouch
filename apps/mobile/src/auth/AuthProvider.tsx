import type { AuthFailureReason } from '@calouch/analytics';
import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { classifyAuthError } from './authErrors';
import { registerAuthAutoRefresh, supabase } from './supabase';

export type AuthResult = { ok: true; isNewUser: boolean } | { ok: false; reason: AuthFailureReason };

type AuthContextValue = {
  session: Session | null;
  /** Cold start'ta oturum diskten okunana kadar true. */
  isRestoring: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Cold start: diskteki oturumu geri yükle (§02 "session restore").
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session);
      })
      .catch(() => {
        // Okunamayan oturum = oturum yok. Kullanıcı giriş ekranını görür,
        // uygulama açılışta çökmez.
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    // Token yenileme, çıkış ve başka sekmeden gelen değişiklikler burada akar;
    // state tek kaynaktan güncellenir.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!cancelled) setSession(nextSession);
    });

    const unregisterAutoRefresh = registerAuthAutoRefresh();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      unregisterAutoRefresh();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, reason: classifyAuthError(error) };
      return { ok: true, isNewUser: false };
    } catch (error) {
      return { ok: false, reason: classifyAuthError(error) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { ok: false, reason: classifyAuthError(error) };

      // E-posta doğrulaması açıkken session null döner ve kullanıcı henüz
      // giriş yapmış sayılmaz; UI "e-postanı kontrol et" göstermeli.
      return { ok: true, isNewUser: data.session !== null };
    } catch (error) {
      return { ok: false, reason: classifyAuthError(error) };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Sunucu çağrısı başarısız olsa da yerel oturum temizlenir; aksi hâlde
    // kullanıcı "çıkış yaptım" sanırken oturumda kalır.
    try {
      await supabase.auth.signOut();
    } catch {
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isRestoring,
      isAuthenticated: session !== null,
      signIn,
      signUp,
      signOut,
    }),
    [session, isRestoring, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (context === null) {
    throw new Error('useAuth, AuthProvider içinde çağrılmalı');
  }
  return context;
}
