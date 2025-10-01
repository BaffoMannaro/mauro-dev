import { Formik, Field, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';

import Button from '../Atoms/Button';

import { useEffect } from 'react';
import useDebouncer from '../../utils/useDebouncer';

export default function FormObserverDebouncer() {
    const handleSubmit = async (values) => {
        console.log(values);
    };

    return (
        <Formik
            initialValues={{
                email: '',
                password: '',
                number: '',
                toggle: false,
            }}
            validationSchema={Yup.object({
                password: Yup.string()
                    .min(3, 'Must be 3 characters or more')
                    .required('Required'),
                email: Yup.string().email().required('Required'),
            })}
            onSubmit={(values) => handleSubmit(values)}
        >
            {({ values }) => (
                <Form className="flex w-4/5 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900 md:w-1/3">
                    <div className="w-full text-center">
                        <h1 className=" text-black dark:text-white">
                            Form Observer Debouncer, with conditional fields for
                            number
                        </h1>
                    </div>
                    <div className="mb-8 w-full px-2">
                        <Field
                            name="email"
                            component={Input}
                            label="email"
                            type="email"
                        />
                    </div>

                    <div className="mb-8 w-full px-2">
                        <Field
                            name="password"
                            component={Input}
                            label="Password"
                            type="password"
                        />
                    </div>

                    <div className="mb-8 w-full px-2">
                        <Field
                            name="number"
                            component={Input}
                            label="number"
                            type="number"
                        />
                    </div>

                    {values.number === 0 && (
                        <div className="mb-8 w-full px-2">
                            <label>
                                Toggle
                                <Field type="checkbox" name="toggle" />
                            </label>
                        </div>
                    )}

                    <div className="w-full text-center">
                        <Button type={'submit'} variant={'trusty-azure-1'}>
                            Submit{' '}
                            <i className="fal fa-long-arrow-right ml-8"></i>
                        </Button>
                    </div>
                    <FormObserver />
                </Form>
            )}
        </Formik>
    );
}

// form observer to watch values...
const FormObserver = () => {
    const { values } = useFormikContext();
    const debouncedLogValues = useDebouncer((val) => console.log(val), 1000, [
        values,
    ]);

    // ...debounce any logic you wish
    useEffect(() => {
        debouncedLogValues(values);
    }, [values, debouncedLogValues]);

    return null;
};
