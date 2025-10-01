import { useEffect, useState } from 'react';
import useAxios from '../../utils/useAxios';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';
import Button from '../Atoms/Button';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../Stores/useAuthStore';

// eslint-disable-next-line react-hooks/rules-of-hooks
const api = useAxios();

export default function ProfilePage() {
    const [data, setData] = useState();

    const user = useAuthStore((state) => state.allUserData);
    console.log(user);
    useEffect(() => {
        const getData = async () => {
            try {
                const response = await api.get(`/users/${user.user_id}`);
                const data = response.data;
                console.log(data);
                const initial = {
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    password: '',
                    passwordConfirm: '',
                };
                setData(initial);
            } catch (error) {
                console.log(error);
            }
        };
        getData();
    }, []);

    const updateProfile = async (values) => {
        try {
            const response = await api.put(`/users/${user.user_id}/`, {
                email: data.email,
                first_name: values.first_name,
                last_name: values.last_name,
                password: values.password,
            });
            console.log('res', response.data);
            toast.success('Profile Updated!');

            user.first_name = response.data.first_name;
            user.last_name = response.data.last_name;

            await login(data.email, values.password);
        } catch (error) {
            console.log(error);
            /* toast.error(error.message); */
        }
    };

    return (
        <div className="flex justify-center mt-12">
            {data && (
                <Formik
                    initialValues={data}
                    validationSchema={Yup.object({
                        password: Yup.string()
                            .min(3, 'Must be 3 characters or more')
                            .required('Required'),
                        email: Yup.string().email().required('Required'),
                        first_name: Yup.string().required('Required'),
                        last_name: Yup.string().required('Required'),
                        passwordConfirm: Yup.string().oneOf(
                            [Yup.ref('password'), null],
                            'Passwords must match'
                        ),
                    })}
                    onSubmit={(values) => updateProfile(values)}
                    validateOnMount={true}
                    enableReinitialize={true}
                >
                    <Form className="flex w-11/12 md:w-1/3 flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900">
                        <div className="w-full text-center">
                            <h1 className="text-4xl font-esa text-black dark:text-white mb-12">
                                User Profile
                            </h1>
                        </div>
                        <div className="mb-8 w-full px-2">
                            <Field
                                name="email"
                                component={Input}
                                label="Email"
                                type="email"
                                disabled={true}
                            />
                        </div>

                        <div className="mb-8 w-1/2 px-2">
                            <Field
                                name="first_name"
                                component={Input}
                                label="first_name"
                                type="text"
                            />
                        </div>
                        <div className="mb-8 w-1/2 px-2">
                            <Field
                                name="last_name"
                                component={Input}
                                label="last_name"
                                type="text"
                            />
                        </div>
                        <div className="mb-8 w-1/2 px-2">
                            <Field
                                name="password"
                                component={Input}
                                label="Password"
                                type="password"
                            />
                        </div>
                        <div className="mb-8 w-1/2 px-2">
                            <Field
                                name="passwordConfirm"
                                component={Input}
                                label="Password Confirm"
                                type="password"
                            />
                        </div>
                        <div className="w-full text-center">
                            <Button
                                label={'UPDATE'}
                                type={'submit'}
                                variant={'trusty-azure-1'}
                            />
                        </div>
                    </Form>
                </Formik>
            )}
        </div>
    );
}
