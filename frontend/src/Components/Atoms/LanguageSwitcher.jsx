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
            className="bg-transparent text-white xl:px-4 py-2 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[14px] xl:text-[16px] group"
            type="button"
        >
            {i18n.resolvedLanguage === 'it' ? 'IT' : 'EN'}
        </button>
    );
}
