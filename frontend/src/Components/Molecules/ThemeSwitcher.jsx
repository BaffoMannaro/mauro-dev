import { useEffect } from 'react';
import useThemeStore from '../../Stores/themeStore';

export default function ThemeSwitcher() {
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList = theme;
    }, [theme]);

    return (
        <div>
            <button
                onClick={toggleTheme}
                type="button"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
                {theme === 'dark' ? (
                    <i className="fal fa-moon text-white"></i>
                ) : (
                    <i className="fal fa-sun text-gray-900"></i>
                )}
            </button>
        </div>
    );
}
