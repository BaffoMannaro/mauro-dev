import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../Costants/index";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const change = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="flex cursor-pointer">
      {LANGUAGES.map((el) => (
        <span
          className={
            "mx-2  uppercase " +
            (el.code === i18n.resolvedLanguage ? "font-bold" : "")
          }
          onClick={() => change(el.code)}
          key={el.code}
        >
          {el.code}
        </span>
      ))}
    </div>
  );
}
