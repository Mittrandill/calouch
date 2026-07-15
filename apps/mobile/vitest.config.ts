import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Bu kurulum yalnız SAF mantığı test eder: redaksiyon, hata sınıflandırma,
 * SecureStore parçalama. Bileşen render testi Metro/RN runtime gerektirir ve
 * ayrı bir işin konusudur (§12).
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
