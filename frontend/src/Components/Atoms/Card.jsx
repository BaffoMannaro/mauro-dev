export default function Card({ variant, children }) {
    let style =
        'p-6 border-2 rounded-md shadow-lg text-dark dark:text-white ' +
        `border-${variant}`;

    return <div className={style}>{children}</div>;
}
