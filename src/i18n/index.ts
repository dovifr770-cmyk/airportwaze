// ── i18next initialisation ─────────────────────────────────
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { en, he, es } from './locales';

// ── Constants ─────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'he' | 'es';

export const SUPPORTED_LANGUAGES: Array<{
  code:  SupportedLanguage;
  label: string;
  isRTL: boolean;
}> = [
  { code: 'en', label: 'English', isRTL: false },
  { code: 'he', label: 'עברית',   isRTL: true  },
  { code: 'es', label: 'Español', isRTL: false },
];

export const RTL_LANGUAGES: SupportedLanguage[] = ['he'];

const LANGUAGE_KEY = '@airportwaze_language';

// ── AsyncStorage language detector ────────────────────────

const languageDetector = {
  type:  'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored) { callback(stored); return; }
    } catch (_) { /* ignore */ }

    // Fall back to device locale
    const locale = Localization.getLocales()?.[0]?.languageCode ?? 'en';
    const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
    callback(supported.includes(locale as SupportedLanguage) ? locale : 'en');
  },
  init:            () => undefined,
  cacheUserLanguage: async (lng: string) => {
    try { await AsyncStorage.setItem(LANGUAGE_KEY, lng); } catch (_) { /* ignore */ }
  },
};

// ── i18next init ──────────────────────────────────────────

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      he: { translation: he },
      es: { translation: es },
    },
    fallbackLng:   'en',
    interpolation: { escapeValue: false },
    // react-i18next options
    react: { useSuspense: false },
  });

export default i18n;

// ── Helpers ───────────────────────────────────────────────

/** Returns true if the currently active language is RTL */
export function isCurrentRTL(): boolean {
  return RTL_LANGUAGES.includes(i18n.language as SupportedLanguage);
}

/**
 * Switch language, persist to AsyncStorage.
 * The caller is responsible for triggering I18nManager.forceRTL + restart
 * when switching to / from a RTL language (see LanguagePicker).
 */
export async function changeLanguage(code: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
  } catch (_) { /* ignore */ }
}
