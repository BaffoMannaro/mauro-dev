import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.resolvedLanguage === 'it' ? 'en' : 'it';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="text-white hover:bg-zinc-500 cursor-pointer focus:outline-none font-medium rounded-lg text-sm p-2.5 inline-flex items-center"
            type="button"
        >
            {i18n.resolvedLanguage === 'it' ? 'IT' : 'EN'}
        </button>
    );
}
