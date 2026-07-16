import { Platform } from 'react-native';

import { largeSecureStore } from './secureStorage';
import { webDevStorage } from './webDevStorage';

/**
 * Supabase'in oturumu yazdığı depo.
 *
 * iOS/Android (tek gerçek hedef, §00): şifreli SecureStore, 2048 bayt sınırını
 * aşan oturumlar için parçalanmış (§09).
 *
 * Web: yalnız geliştirme sırasında tarayıcıda göz atmak için localStorage.
 * `webDevStorage` production'da yüklenmeyi reddeder.
 *
 * `Platform.OS` derleme zamanında sabittir; mobil bundle'a web dalı,
 * web bundle'ına SecureStore dalı fiilen girmez.
 */
export const authStorage = Platform.OS === 'web' ? webDevStorage : largeSecureStore;
