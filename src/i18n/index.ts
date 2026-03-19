import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en';
import ro from './ro';

const deviceLocales = getLocales();
const deviceLanguage = deviceLocales?.[0]?.languageCode ?? 'en';
const defaultLanguage = deviceLanguage.startsWith('ro') ? 'ro' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
