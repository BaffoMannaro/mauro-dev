import { useEffect, useState } from 'react';
import Button from '../Atoms/Button';
import useAxios from '../../utils/useAxios';
import { Form, Formik, Field } from 'formik';
import * as Yup from 'yup';
import MultiSelect from '../Molecules/Select';

export default function GetPostTest() {
    const [message, setMessage] = useState();
    const api = useAxios();

    const testGet = async () => {
        try {
            const response = await api.get('/api/test/');
            setMessage(response.data.response);
        } catch (error) {
            setMessage('ops');
        }
    };

    const testPost = async () => {
        try {
            const response = await api.post('api/test/', {
                text: 'Test Message to send',
            });
            setMessage(response.data.response);
        } catch (error) {
            setMessage('ops');
        }
    };

    return (
        <div>
            <h1>GetPostTest</h1>

            <div className="flex">
                <div className="mx-2">
                    <Button
                        type={'button'}
                        variant={'trusty-azure-1'}
                        onClick={testGet}
                    >
                        Test Get
                    </Button>
                </div>

                <div className="mx-2">
                    <Button
                        type={'button'}
                        variant={'excite-red-1'}
                        onClick={testPost}
                    >
                        Test Post
                    </Button>
                </div>
            </div>

            <div>{message && message}</div>
        </div>
    );
}
