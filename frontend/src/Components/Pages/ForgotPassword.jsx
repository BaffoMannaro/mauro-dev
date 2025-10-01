import * as Yup from 'yup';

import { Field, Form, Formik } from 'formik';
import LogoImage from '../../assets/images/logo-dark.svg';
import Button from '../Atoms/Button';
import Input from '../Molecules/Input';
import { useState } from 'react';

const ForgotPassword = () => {
    const [message, setmessage] = useState();

    const sendEMail = (values) => {
        console.log(values);

        const env = import.meta.env.MODE;

        const backend =
            env === 'development' ? import.meta.env.VITE_BACKEND_URL : 'FIXME';
        fetch(backend + 'send-password-reset-email/', {
            method: 'POST',
            body: JSON.stringify({ email: values.email }),
        })
            .then((r) => r.json())
            .then((r) => {
                console.log(r);
                if (r.status === 200) {
                    setmessage(r.response);
                } else {
                    setmessage('Ops');
                }
            });
    };

    return (
        <div className="min-h-screen  bg-deep-space-2 flex flex-col items-center justify-center">
            <div className="mb-12">
                <img src={LogoImage} alt="" />
            </div>

            <Formik
                initialValues={{ email: 'simone.fiore@g-nous.com' }}
                validationSchema={Yup.object({
                    email: Yup.string().email().required('Required'),
                })}
                onSubmit={(values) => sendEMail(values)}
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
                            name="email"
                            component={Input}
                            label="Email"
                            type="email"
                        />
                    </div>

                    <div className="w-full text-center">
                        <div className="w-full text-center">
                            <Button type={'submit'} variant={'trusty-azure-1'}>
                                SUBMIT{' '}
                                <i className="fal fa-long-arrow-right ml-8"></i>
                            </Button>
                        </div>
                    </div>
                </Form>
            </Formik>
            {message && message}
        </div>
    );
};

export default ForgotPassword;
