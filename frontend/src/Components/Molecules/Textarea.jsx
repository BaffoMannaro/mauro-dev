export default function Textarea({
    field,
    label,
    form: { touched, errors },
    ...props
}) {
    return (
        <>
            <div className="group relative z-0 w-full">
                <label className="block mb-2 font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </label>
                <textarea
                    {...field}
                    {...props}
                    rows={4}
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 border border-gray-500 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-400  dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder=""
                ></textarea>
            </div>
            {touched[field.name] && errors[field.name] && (
                <div className="font-bold text-red-500">
                    {errors[field.name]}
                </div>
            )}
        </>
    );
}
