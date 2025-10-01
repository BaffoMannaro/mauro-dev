import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const MultiSelect = ({
    field,
    form: { touched, errors },
    form,
    options,
    isMulti = false,
    placeholder = 'Select',
    label,
}) => {
    function onChange(option) {
        form.setFieldValue(
            field.name,
            option ? option.map((item) => item.value) : []
        );
    }

    const getValue = () => {
        if (options) {
            return isMulti
                ? options.filter(
                      (option) => field.value.indexOf(option.value) >= 0
                  )
                : options.find((option) => option.value === field.value);
        } else {
            return isMulti ? [] : '';
        }
    };

    const animatedComponents = makeAnimated();

    if (!isMulti) {
        return (
            <>
                <label className="  text-gray-500  duration-300 peer-placeholder-shown:translate-y-0 peer-focus:left-0 peer-focus:-translate-y-8 peer-focus:font-medium  dark:text-gray-400">
                    {label}
                </label>
                <Select
                    options={options}
                    name={field.name}
                    components={animatedComponents}
                    value={
                        options
                            ? options.find(
                                  (option) => option.value === field.value
                              )
                            : ''
                    }
                    onChange={(option) =>
                        form.setFieldValue(field.name, option.value)
                    }
                    onBlur={field.onBlur}
                    placeholder={placeholder}
                    isSearchable={true}
                    theme={(theme) => ({
                        ...theme,
                        borderRadius: 4,
                        colors: {
                            ...theme.colors,
                            primary25: '#ddd',
                            primary: '#009bdb',
                        },
                    })}
                    classNamePrefix="react-select"
                    /* styles={colourStyles} */
                    /* menuIsOpen */
                />
                {touched[field.name] && errors[field.name] && (
                    <div className="font-bold text-red-500">
                        {errors[field.name]}
                    </div>
                )}
            </>
        );
    } else {
        return (
            <>
                <label className="  text-gray-500  duration-300 peer-placeholder-shown:translate-y-0 peer-focus:left-0 peer-focus:-translate-y-8 peer-focus:font-medium  dark:text-gray-400">
                    {label}
                </label>
                <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    components={animatedComponents}
                    name={field.name}
                    value={getValue()}
                    onChange={onChange}
                    options={options}
                    isMulti={true}
                    placeholder={placeholder}
                    isSearchable={true}
                    theme={(theme) => ({
                        ...theme,
                        borderRadius: 0,
                        colors: {
                            ...theme.colors,
                            primary25: '#ddd',
                            primary: 'black',
                        },
                    })}
                />
                {touched[field.name] && errors[field.name] && (
                    <div className="font-bold text-red-500">
                        {errors[field.name]}
                    </div>
                )}
            </>
        );
    }
};

export default MultiSelect;
