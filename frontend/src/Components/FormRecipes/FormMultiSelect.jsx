import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import MultiSelect from '../Molecules/Select';
import { useState } from 'react';
import { useEffect } from 'react';
import Button from '../Atoms/Button';

export default function FormMultiSelect() {
    const [options, setOptions] = useState();
    useEffect(() => {
        fetch('https://jsonplaceholder.typicode.com/comments')
            .then((r) => r.json())
            .then((r) => {
                const data = r.map((el) => {
                    return {
                        value: el.id,
                        label: el.name,
                    };
                });
                setOptions(data);
            });
    }, []);

    return (
        <div>
            <Formik
                initialValues={{ value: [] }}
                validationSchema={Yup.object({
                    value: Yup.array().min(3, 'Minimum of 3'),
                    /* value: Yup.string().required(), */
                })}
                onSubmit={(values) => console.log(values)}
            >
                <Form className="flex w-4/5 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900 md:w-1/3">
                    <div className="w-full text-center text-black dark:text-white">
                        Test for multiselect
                    </div>

                    <p className="text-xs mb-12">
                        Select with props isMulti for single/multi choice,
                        prefetched data, and research
                    </p>

                    <div className="mb-8 w-full px-2">
                        {options && (
                            <>
                                <Field
                                    name="value"
                                    id="value"
                                    placeholder="Select some stuff"
                                    isMulti={false}
                                    component={MultiSelect}
                                    options={options}
                                    label="Select some stuff"
                                />
                                {/*  <div className="text-red-500 font-bold">
                                    <ErrorMessage name="value" />
                                </div> */}
                            </>
                        )}
                    </div>

                    <div className="w-full text-center">
                        <div className="w-full text-center">
                            <Button type={'submit'} variant={'trusty-azure-1'}>
                                Submit{' '}
                                <i className="fal fa-long-arrow-right ml-8"></i>
                            </Button>
                        </div>
                    </div>
                </Form>
            </Formik>
        </div>
    );
}
