import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../Costants/index";
import { useState } from "react";

export default function Language() {
  const [open, setOpen] = useState(false);

  const { i18n } = useTranslation();

  const change = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center font-medium justify-center px-4  text-sm text-gray-900 dark:text-white rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white uppercase"
      >
        {i18n.resolvedLanguage}
      </button>
      <div
        className={
          "z-50 absolute right-0 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 " +
          (open ? "" : "hidden")
        }
        id="language-dropdown-menu"
      >
        <ul className="py-2 font-medium" role="none">
          {LANGUAGES.map((el) => (
            <li
              className={
                "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white uppercase cursor-pointer " +
                (el.code === i18n.resolvedLanguage ? "font-bold" : "")
              }
              onClick={() => change(el.code)}
              key={el.code}
            >
              {el.code}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
