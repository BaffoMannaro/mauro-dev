import { useEffect, useRef, useState } from 'react';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';
import Button from '../Atoms/Button';
import Textarea from '../Molecules/Textarea';

export default function FormPrefill() {
    const [data, setData] = useState();
    const [validationSchema, setvalidationSchema] = useState();

    const [touched, setTouched] = useState();

    const getDataFromBackend = () => {
        fetch('https://jsonplaceholder.typicode.com/users/1')
            .then((r) => r.json())
            .then((r) => {
                console.log(r);
                const data = {
                    username: '',
                    email: r.email,
                    company: r.company.name,
                    address: 'a',
                };

                // set all fields as required
                setvalidationSchema(
                    Object.fromEntries(
                        Object.entries(data).map((el) => {
                            console.log(el);
                            let validation = Yup.string().required('Required');
                            if (el[0] == 'email') {
                                validation = Yup.string()
                                    .email()
                                    .required('Required');
                            }
                            return [el[0], validation];
                        })
                    )
                );

                // set all fields as touched on load to validate asap
                setTouched(
                    Object.fromEntries(
                        Object.entries(data).map((el) => [el[0], true])
                    )
                );

                setData(() => data);
            });
    };

    const getDataFromStorage = () => {
        const data = JSON.parse(localStorage.getItem('form'));
        let initial = Object.fromEntries(
            Object.entries(data).map((el) => [
                el[0],
                Yup.string().required('Required'),
            ])
        );
        console.log('initial', initial);

        setvalidationSchema(initial);

        let touched = Object.fromEntries(
            Object.entries(data).map((el) => [el[0], true])
        );
        touched.friends = true;
        console.log('touched', touched);
        setTouched(touched);
        setData(data);
    };

    useEffect(() => {
        if (localStorage.getItem('form')) {
            getDataFromStorage();
        } else {
            getDataFromBackend();
        }
    }, []);

    const draft = () => {
        const data = ref.current.values;
        // save draft values in ls
        console.log(data);
        localStorage.setItem('form', JSON.stringify(data));
    };

    const ref = useRef();

    return (
        data && (
            <Formik
                innerRef={ref}
                initialValues={data}
                validateOnMount
                initialTouched={touched}
                validationSchema={Yup.object(validationSchema)}
                onSubmit={(values) => console.log(values)}
            >
                <Form className="flex  flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900  w-11/12 mx-auto mt-8">
                    <div className="w-full text-center">
                        <h1 className=" text-black dark:text-white">
                            Prefilled form with real-time validation
                        </h1>
                    </div>
                    <div className="mb-8 w-full px-2">
                        <Field
                            name="username"
                            component={Input}
                            label="Username"
                            type="text"
                        />
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
                            name="company"
                            component={Input}
                            label="company"
                            type="text"
                        />
                    </div>

                    <div className="mb-8 w-full px-2">
                        <Field
                            name="address"
                            component={Textarea}
                            label="address"
                            type="text"
                        />
                    </div>

                    <div className="w-full flex justify-center">
                        <div className="mx-2">
                            <Button
                                type={'buttonn'}
                                variant={'trusty-azure-1'}
                                onClick={draft}
                            >
                                Draft
                                <i className="fal fa-long-arrow-right ml-8"></i>
                            </Button>
                        </div>
                        <div className="mx-2">
                            <Button
                                type={'submit'}
                                variant={'trusty-azure-1'}
                                fill
                            >
                                Save{' '}
                                <i className="fal fa-long-arrow-right ml-8"></i>
                            </Button>
                        </div>
                    </div>
                </Form>
            </Formik>
        )
    );
}
