import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';

const saved = localStorage.getItem('accounting_lang') || 'fr';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar } },
  lng: saved,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';

export default i18n;
