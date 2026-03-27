import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const toggleLanguage = async () => {
        const newLang = i18n.resolvedLanguage === 'it' ? 'en' : 'it';
        const currentPath = location.pathname || '/';

        // If we're on an article page, switch to the corresponding language slug.
        const match = currentPath.match(/^\/articles\/([^/]+)\/?$/);
        if (match) {
            const currentSlug = match[1];
            const backendBase =
                import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            try {
                const response = await axios.get(
                    `${backendBase}/blog/articles/${currentSlug}/`
                );
                const article = response.data;
                const targetSlug =
                    newLang === 'en'
                        ? article?.slugs?.en || article?.slug_en
                        : article?.slugs?.it || article?.slug;
                if (targetSlug && targetSlug !== currentSlug) {
                    navigate(
                        {
                            pathname: `/articles/${targetSlug}`,
                            search: location.search,
                            hash: location.hash,
                        },
                        { replace: true }
                    );
                }
            } catch {
                // Fallback to language-only switch.
            }
        }

        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="bg-transparent text-white xl:px-4 py-2 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[14px] xl:text-[16px] group me-5 lg:me-0"
            type="button"
        >
            {i18n.resolvedLanguage === 'it' ? 'IT' : 'EN'}
        </button>
    );
}
