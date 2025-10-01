export default function Input({ field, form: { touched, errors }, ...props }) {
    return (
        <>
            <label
                htmlFor={field.name}
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
                {props.label}
            </label>
            <input
                type={props.type}
                {...field}
                {...props}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            {touched[field.name] && errors[field.name] && (
                <div className="font-bold text-red-500">
                    {errors[field.name]}
                </div>
            )}
        </>
    );
}

/* export default function Input({ field, form: { touched, errors }, ...props }) {
    return (
        <>
            <div className="group relative z-0 w-full">
                <input
                    type={props.type}
                    {...field}
                    {...props}
                    className="peer block w-full appearance-none border-0 border-b-2 border-gray-500 bg-transparent py-2.5 text-gray-900 focus:outline-none  focus:ring-0 dark:border-gray-400  dark:text-white dark:disabled:bg-slate-800 disabled:bg-slate-200 "
                    placeholder=""
                    autoComplete="off"
                />

                <label className="absolute top-3  -z-10 origin-[0] -translate-y-8  text-gray-500  duration-300 peer-placeholder-shown:translate-y-0 peer-focus:left-0 peer-focus:-translate-y-8 peer-focus:font-medium  dark:text-gray-400">
                    {props.label}
                </label>
            </div>
            {touched[field.name] && errors[field.name] && (
                <div className="font-bold text-red-500">
                    {errors[field.name]}
                </div>
            )}
        </>
    );
}
 */
