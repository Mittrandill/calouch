// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * PRD §01 ve §02'nin mimari kurallarını kod incelemesine bırakmayıp
 * CI kapısına dönüştürür.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      '**/coverage/**',
      '**/.turbo/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Metro/babel gibi araç config'leri CommonJS ve Node ortamında çalışır.
  {
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Hook kuralları: bağımlılık dizisi hataları, tema/oturum sağlayıcılarında
  // bayat state olarak ortaya çıkar ve testte zor yakalanır.
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // §01 kabul kriteri: "Domain paketleri UI/framework bağımlılığından ayrılmış."
  // Domain mantığı saf TypeScript kalır; test edilebilirliği ve web/admin'de
  // yeniden kullanımı buna bağlı.
  {
    files: [
      'packages/nutrition-engine/**/*.ts',
      'packages/activity-engine/**/*.ts',
      'packages/pose-engine/**/*.ts',
      'packages/health-connectors/**/*.ts',
      'packages/types/**/*.ts',
      'packages/validation/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@react-native*'],
              message:
                'PRD §01: Domain paketleri UI/framework bağımlılığı taşıyamaz. Saf TypeScript tut.',
            },
            {
              group: ['@supabase/*'],
              message:
                'PRD §01: Domain paketi veri erişimi yapmaz. Veriyi argüman olarak al.',
            },
          ],
        },
      ],
    },
  },

  // §01: "UI paketine veri erişimi ... koyma."
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*', '@tanstack/react-query'],
              message:
                'PRD §01: UI paketi veri erişimi taşımaz. Veriyi prop olarak al.',
            },
          ],
        },
      ],
    },
  },

  // §02 Token zorunluluğu: "Kod içinde doğrudan renk, radius ve spacing kullanılmaz."
  // Ham değer, 4 temanın (system/light/dark/OLED) sessizce bozulduğu yerdir.
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    ignores: ['packages/design-tokens/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            'PRD §02: Ham renk kodu yasak. @calouch/design-tokens içindeki semantik token kullan.',
        },
        {
          // `[value>0]` kullanılır, regex değil: sayısal literal'in `value`'su
          // number'dır ve esquery orada regex eşleştirmez — regex'li bir
          // seçici sessizce hiçbir şey yakalamaz.
          // 0 serbest: `padding: 0` bir tasarım kararı değil, sıfırlamadır.
          // StyleSheet.create ile sınırlı DEĞİL: satır içi stildeki ham değer
          // de aynı sorundur.
          // top/bottom/left/right bilinçli olarak DIŞARIDA: bunlar safe-area
          // bayrağı (`edges={{ top: true }}`) ve mutlak konumlandırma için de
          // kullanılır — JS'te `true > 0` doğru olduğundan yanlış pozitif verir.
          selector: 'Property[key.name=/^(margin|padding|gap|borderRadius)/] > Literal[value>0]',
          message:
            'PRD §02: Ham spacing/radius yasak. tokens.spacing veya tokens.radius kullan.',
        },
      ],
    },
  },

  // §01 kabul kriteri: "Mobil bundle'da Gemini/service-role secret yok."
  // CI'daki bundle taramasının yanında ikinci savunma hattı.
  // src/env.ts tek kapıdır ve bu kuraldan muaftır.
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    ignores: ['apps/mobile/src/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'PRD §01: Mobil kod env değişkenine doğrudan erişmez. @calouch/config üzerinden geç — o katman EXPO_PUBLIC_* dışını reddeder.',
        },
      ],
    },
  },
);
