import type { Translations } from './tr';

/**
 * `Translations` tipi TR'den türediği için, TR'ye eklenen bir anahtar burada
 * eksikse derleme kırılır. Çeviri unutmak sessiz bir hata olamaz.
 */
export const en: Translations = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    retry: 'Try again',
    loading: 'Loading',
    error: 'Something went wrong',
  },
  tabs: {
    today: 'Today',
    diary: 'Diary',
    camera: 'AI Camera',
    training: 'Training',
    profile: 'Profile',
  },
  a11y: {
    cameraAction: 'Analyze a meal with AI Camera',
    tabSelected: 'selected',
  },
  auth: {
    signInTitle: 'Welcome back',
    signUpTitle: 'Get started with Calouch',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    forgotPassword: 'Forgot password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    magicLink: 'Send me a link',
    checkEmail: 'Check your email for the verification link',
  },
  authError: {
    invalidCredentials: 'Email or password is incorrect',
    emailInUse: 'This email is already registered',
    weakPassword: 'Password must be at least 8 characters',
    invalidEmail: 'Enter a valid email',
    network: "Couldn't connect. Check your internet and try again.",
    rateLimited: 'Too many attempts. Wait a moment and try again.',
    unknown: "Couldn't sign in. Try again.",
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      oled: 'OLED black',
    },
  },
  placeholder: {
    today: 'The Today screen arrives in wave 1C',
    diary: 'The Diary arrives in wave 1B',
    training: 'Training arrives in phase 2',
  },
};
