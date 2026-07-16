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
  onboarding: {
    back: 'Back',
    next: 'Continue',
    skip: 'Skip',
    saving: 'Saving',

    name: {
      title: 'What should we call you?',
      subtitle: "You can skip this step if you'd like.",
      placeholder: 'Name or nickname',
    },

    unit: {
      title: 'Unit system',
      subtitle: 'Which units would you like to use for height and weight?',
      metric: 'Metric (cm, kg)',
      imperial: 'Imperial (ft/in, lb)',
    },

    birthYear: {
      title: 'What year were you born?',
      subtitle: 'Needed to estimate your daily energy needs.',
      placeholder: 'e.g. 1996',
    },

    height: {
      title: "What's your height?",
      placeholderCm: 'cm',
      placeholderFeet: 'ft',
      placeholderInches: 'in',
    },

    weight: {
      title: 'Your current and target weight',
      current: 'Current weight',
      target: 'Target weight',
      placeholderKg: 'kg',
      placeholderLb: 'lb',
    },

    sex: {
      title: 'Biological sex',
      subtitle:
        "Used only for calorie accuracy; if you skip, we'll use an approximate estimate.",
      male: 'Male',
      female: 'Female',
      skip: "I'd rather not say",
    },

    activity: {
      title: "What's your activity level?",
      sedentary: 'Sedentary',
      sedentaryHint: 'Desk job, no planned exercise',
      light: 'Lightly active',
      lightHint: 'Light exercise 1-3 days a week',
      moderate: 'Moderately active',
      moderateHint: 'Moderate exercise 3-5 days a week',
      active: 'Active',
      activeHint: 'Exercise 6-7 days a week',
      veryActive: 'Very active',
      veryActiveHint: 'Two workouts a day, or physical job',
    },

    goal: {
      title: "What's your main goal?",
      loseWeight: 'Lose weight',
      gainWeight: 'Gain weight',
      maintainWeight: 'Maintain weight',
      buildMuscle: 'Build muscle',
      eatHealthy: 'Eat healthy',
      increaseActivity: 'Increase activity',
      trainingRoutine: 'Build a training routine',
      improveMeasurements: 'Improve body measurements',
    },

    pace: {
      title: 'Weekly pace',
      subtitle: 'How fast would you like to progress?',
      perWeek: 'kg/week',
      tooFastWarning: "This pace is above the sustainable range; you can still continue.",
    },

    diet: {
      title: 'Dietary preference',
      subtitle: "You can skip this step if you'd like.",
      omnivore: 'Omnivore',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      pescatarian: 'Pescatarian',
      other: 'Other',
      mealsPerDayLabel: 'How many meals a day?',
    },

    summary: {
      title: 'Your daily goals are ready',
      subtitle: 'You can change any value manually at any time.',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      fiber: 'Fiber',
      water: 'Water',
      lowConfidenceNote:
        "Since biological sex wasn't specified, this estimate is approximate; you can adjust it manually.",
      warningBelowSafeMinimum:
        'The calculated target was below the safe minimum; it was raised to the limit.',
      warningBelowBmr: "This target is below your basal metabolic rate.",
      warningTooFast: 'The weekly pace you chose is above the sustainable range.',
      professionalAdviceNotice:
        "We recommend speaking with a healthcare professional for a target this low. Calouch doesn't provide medical advice.",
      finish: 'Get started',
    },

    validation: {
      required: 'This field is required',
      outOfRange: 'Value is outside the expected range',
    },
  },
};
