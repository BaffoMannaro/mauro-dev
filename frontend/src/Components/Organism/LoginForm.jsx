import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';
import { useNavigate } from 'react-router-dom';

import Button from '../Atoms/Button';
import useAxios from '../../utils/useAxios';

import { toast } from 'react-hot-toast';
import useAuthStore from '../../Stores/useAuthStore';

export default function LoginForm() {
    const navigate = useNavigate();

    const api = useAxios();
    const setTokens = useAuthStore((state) => state.setTokens);

    const handleLogin = async (values) => {
        try {
            const response = await api.post(
                'http://localhost:8000/api/token/',
                {
                    email: values.email,
                    password: values.password,
                }
            );
            const { access, refresh } = response.data;
            setTokens(access, refresh);
            toast.success('Logged in!');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Formik
            initialValues={{
                email: 'root@root.root',
                password: 'root',
                showPassword: false,
            }}
            validationSchema={Yup.object({
                password: Yup.string()
                    .min(3, 'Must be 3 characters or more')
                    .required('Required'),
                email: Yup.string().email().required('Required'),
            })}
            onSubmit={(values) => handleLogin(values)}
        >
            {({ values }) => (
                <Form className="flex w-4/5 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900 md:w-1/3">
                    <div className="w-full text-center">
                        <h1 className="text-4xl font-esa text-black dark:text-white">
                            Login
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

                    <div className="mb-8 w-full px-2 relative">
                        <Field
                            name="password"
                            component={Input}
                            label="Password"
                            type={
                                values.showPassword == true
                                    ? 'text'
                                    : 'password'
                            }
                        />
                        {/* <i
                            className="fas fa-eye text-white absolute top-10 right-8"
                            onMouseOver={() => console.log('asd')}
                        ></i> */}
                        <div className="mt-4 text-white">
                            <Field type="checkbox" name="showPassword" />
                            Show Password
                        </div>
                    </div>

                    <div className="w-full text-center">
                        <Button type={'submit'} variant={'trusty-azure-1'}>
                            LOGIN{' '}
                            <i className="fal fa-long-arrow-right ml-8"></i>
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}
