export default function Button({
    children,
    onClick,
    type,
    variant,
    disabled,
    fill,
}) {
    let hasFill = fill
        ? `border-${variant} text-white bg-${variant} disabled:cursor-not-allowed`
        : `border-${variant} text-${variant} hover:text-white hover:bg-${variant} disabled:hover:bg-transparent disabled:text-${variant} disabled:cursor-not-allowed`;
    let style =
        'inline-flex items-center justify-center overflow-hidden border-2  px-4 py-2.5  focus:outline-none focus:ring-none transition duration-300 tracking-[3px] rounded-sm text-xs font-bold hover:translate-y-[-2px] ' +
        hasFill;

    return (
        <button
            type={type}
            onClick={onClick}
            className={style}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
