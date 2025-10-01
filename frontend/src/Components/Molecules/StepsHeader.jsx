export default function StepsHeader({ steps, active, setActive }) {
    return (
        <ol className="flex flex-col md:flex-row md:items-center w-full rounded-lg bg-slate-50 p-8 text-black dark:text-white shadow dark:bg-gray-900">
            {steps &&
                steps.map((el, i) => {
                    if (i + 1 !== steps.length) {
                        return (
                            <li
                                key={i}
                                onClick={() => setActive(i)}
                                className={
                                    `flex md:w-full whitespace-nowrap items-center sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700 cursor-pointer ` +
                                    (active == i
                                        ? 'text-trusty-azure-1 '
                                        : 'text-deep-space-0 dark:text-deep-space-0')
                                }
                            >
                                <span
                                    className={`flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 `}
                                >
                                    {i + 1}. {el.name}
                                </span>
                            </li>
                        );
                    } else {
                        return (
                            <li
                                key={i}
                                onClick={() => setActive(i)}
                                className={
                                    `flex items-center whitespace-nowrap cursor-pointer ` +
                                    (active == i
                                        ? 'text-trusty-azure-1 '
                                        : 'text-deep-space-0 dark:text-deep-space-0')
                                }
                            >
                                {i + 1}. {el.name}
                            </li>
                        );
                    }
                })}
        </ol>
    );
}
