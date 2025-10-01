import useThemeStore from '../../Stores/themeStore';
import logoLight from '../../assets/images/logo-light.svg';
import logoDark from '../../assets/images/logo-dark.svg';

export default function Logo() {
    const theme = useThemeStore((state) => state.theme);
    return theme === 'light' ? (
        <img src={logoLight} alt="" className="" />
    ) : (
        <img src={logoDark} alt="" className="" />
    );
}
