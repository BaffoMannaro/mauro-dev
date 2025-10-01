import { ErrorMessage, Field, Form, Formik } from 'formik';
import React from 'react';
import Button from '../Atoms/Button';
import Input from '../Molecules/Input';
import * as Yup from 'yup';
import useAxios from '../../utils/useAxios';

const onSubmit = async (values) => {
    const body = new FormData();
    console.log(values);
    body.append('myFile', values.myFile);

    /* await fetch('api/upload', {
        method: 'POST',
        body,
    }); */
};

export default function FormFile() {
    const api = useAxios();

    const handleSubmit = async (values) => {
        let data = new FormData();
        data.append('file', values.file);
        console.log(2);
        const response = await api
            .post('/test-upload/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            .then((response) => {
                console.log(response);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <Formik
            initialValues={{
                file: null,
            }}
            validationSchema={Yup.object({
                file: Yup.mixed().required('mit'),
            })}
            onSubmit={(values) => handleSubmit(values)}
        >
            {(formik) => {
                return (
                    <>
                        <Form>
                            <input
                                id="file"
                                name="file"
                                type="file"
                                onChange={(event) => {
                                    const file = event.target.files[0];
                                    console.log(event.target.files[0]);
                                    formik.setFieldValue('file', file);
                                }}
                            />

                            <ErrorMessage name="file" />

                            <Button
                                type={'submit'}
                                variant={'trusty-azure-1'}
                                disabled={formik.isSubmitting}
                            >
                                Submit{' '}
                                <i className="fal fa-long-arrow-right ml-8"></i>
                            </Button>
                        </Form>
                    </>
                );
            }}
        </Formik>
    );
}
