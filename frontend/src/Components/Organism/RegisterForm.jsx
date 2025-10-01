import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';
import { useNavigate } from 'react-router-dom';
import { register } from '../../utils/auth';
import Button from '../Atoms/Button';
import { useState } from 'react';

export default function RegisterForm() {
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const handleSubmit = async (values) => {
        const { error } = await register(
            values.email,
            values.first_name,
            values.last_name,
            values.password,
            values.passwordConfirm
        );
        if (error) {
            console.log(error);
            setMessage('Something went wrong');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <Formik
            initialValues={{
                email: '',
                password: '',
                passwordConfirm: '',
                first_name: '',
                last_name: '',
            }}
            validationSchema={Yup.object({
                password: Yup.string()
                    .required('Required')
                    .min(3, 'Must be 3 characters or more'),
                passwordConfirm: Yup.string().oneOf(
                    [Yup.ref('password'), null],
                    'Passwords must match'
                ),
                first_name: Yup.string().required('Required'),
                last_name: Yup.string().required('Required'),
                email: Yup.string().email().required('Required'),
            })}
            onSubmit={(values) => handleSubmit(values)}
        >
            <Form className="flex w-4/5 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900 md:w-1/3">
                <div className="w-full text-center">
                    <h1 className="text-4xl font-esa text-black dark:text-white">
                        Register
                    </h1>
                </div>

                <div className="mb-8 w-full px-2">
                    <Field
                        name="email"
                        component={Input}
                        label="Email"
                        type="email"
                    />
                </div>

                <div className="mb-8 w-full px-2">
                    <Field
                        name="first_name"
                        component={Input}
                        label="First name"
                        type="text"
                    />
                </div>

                <div className="mb-8 w-full px-2">
                    <Field
                        name="last_name"
                        component={Input}
                        label="Last name"
                        type="text"
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
                        name="passwordConfirm"
                        component={Input}
                        label="Confirm Password"
                        type="password"
                    />
                </div>

                {message && (
                    <div className="w-full text-center my-5 text-red-500 font-bold">
                        {message}
                    </div>
                )}

                <div className="w-full text-center">
                    <div className="w-full text-center">
                        <Button type={'submit'} variant={'trusty-azure-1'}>
                            REGISTER{' '}
                            <i className="fal fa-long-arrow-right ml-8"></i>
                        </Button>
                    </div>
                </div>
            </Form>
        </Formik>
    );
}
