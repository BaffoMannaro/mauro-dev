import i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const env =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5173/'
        : import.meta.env.VITE_PROD_URL;

i18next
    .use(LanguageDetector)
    .use(I18NextHttpBackend)
    .use(initReactI18next)
    .init({
        debug: true,
        fallbackLng: 'it',
        supportedLngs: ['it', 'en'],
        lng: 'it',
        backend: {
            loadPath: `${env}locales/{{lng}}.json`,
        },
    });

export default i18next;
