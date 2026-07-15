import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';

export default function AuthLayout() {
  const { isAuthenticated, isRestoring } = useAuth();

  // Oturumu olan kullanıcı giriş ekranını hiç görmemeli. isRestoring
  // beklenmezse, geri yükleme biterken bir kare giriş ekranı görünür.
  if (!isRestoring && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
