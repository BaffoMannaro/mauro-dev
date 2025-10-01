import * as Yup from 'yup';

import { Field, Form, Formik } from 'formik';
import LogoImage from '../../assets/images/logo-dark.svg';
import Button from '../Atoms/Button';
import Input from '../Molecules/Input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [message, setmessage] = useState();
    const navigate = useNavigate();

    const resetPassword = (values) => {
        const env = import.meta.env.MODE;

        const backend =
            env === 'development' ? import.meta.env.VITE_BACKEND_URL : 'FIXME';

        let params = new URLSearchParams(document.location.search);
        let uid = params.get('uid');
        let token = params.get('token');

        const formValues = {
            new_password: values.new_password,
            confirm_new_password: values.confirm_new_password,
            uid,
            token,
        };

        fetch(backend + 'reset-password/', {
            method: 'POST',
            body: JSON.stringify(formValues),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((r) => r.json())
            .then((r) => {
                console.log(r);
                navigate('/');
            });
    };

    return (
        <div className="min-h-screen  bg-deep-space-2 flex flex-col items-center justify-center">
            <div className="mb-12">
                <img src={LogoImage} alt="" />
            </div>

            <Formik
                initialValues={{ new_password: '', confirm_new_password: '' }}
                validationSchema={Yup.object({
                    new_password: Yup.string()
                        .required('Required')
                        .min(3, 'Must be 3 characters or more'),
                    confirm_new_password: Yup.string().oneOf(
                        [Yup.ref('new_password'), null],
                        'Passwords must match'
                    ),
                })}
                onSubmit={(values) => resetPassword(values)}
            >
                <Form className="flex w-4/5 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900 md:w-1/3">
                    <div className="w-full text-center">
                        <h1 className="text-4xl font-esa text-black dark:text-white">
                            Recover password
                        </h1>
                    </div>

                    <p className="text-slate-300 my-8">
                        Enter your email. A password reset-link will be sent to
                        you.
                    </p>

                    <div className="mb-8 w-full px-2">
                        <Field
                            name="new_password"
                            component={Input}
                            label="New Password"
                            type="password"
                        />
                    </div>

                    <div className="mb-8 w-full px-2">
                        <Field
                            name="confirm_new_password"
                            component={Input}
                            label="Confirm New Password"
                            type="password"
                        />
                    </div>

                    <div className="w-full text-center">
                        <Button
                            label={'SUBMIT'}
                            type={'submit'}
                            variant={'trusty-azure-1'}
                        />
                    </div>
                </Form>
            </Formik>
            {message && message}
        </div>
    );
};

export default ResetPassword;
