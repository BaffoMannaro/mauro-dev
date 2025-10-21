import { Slide } from 'react-awesome-reveal';
import * as Yup from 'yup';

import blockLeft from '../../../src/assets/images/block-left.png';
import blockRight from '../../../src/assets/images/block-right.png';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import modal from '../../assets/images/modal.png';

import brochure from '../../assets/brochure-supero.pdf';
import { useNavigate } from 'react-router-dom';

export default function GetInTouch() {
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_BACKEND_URL + 'marketing/brochure-form/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...values,
                        recaptcha_token: import.meta.env
                            .VITE_RECAPTCHA_PUBLIC_KEY,
                    }),
                }
            );

            if (response.status === 200) {
                // Handle successful response
                console.log('Form submitted successfully');
                setShowModal(false);

                // trigger file download
                const link = document.createElement('a');
                link.href = brochure;
                link.download = 'brochure-supero.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                navigate('/thank-you-page?from=brochure');
            } else {
                // Handle error response
                console.error('Error submitting form');
            }
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <>
            <div className="w-full bg-supero-dark-grey px-12 pb-12 flex justify-center items-center relative h-[500px] overflow-x-hidden">
                <Slide
                    delay={100}
                    triggerOnce
                    direction="left"
                    className="hidden xl:block absolute left-0 top-0 bottom-0"
                >
                    <img src={blockLeft} />
                </Slide>
                <Slide
                    delay={100}
                    triggerOnce
                    direction="right"
                    className="hidden xl:block absolute right-0 top-0 bottom-0"
                >
                    <img src={blockRight} />
                </Slide>

                <div>
                    <p className="title text-center mb-8">
                        Get in{' '}
                        <span className="font-black font-stretch-125">
                            touch
                        </span>
                    </p>

                    <p className="text-supero-mid-grey text-body-l text-center">
                        Ready to see how collaborative robotics can transform
                        your production? <br /> Let’s talk about your challenges
                        and design the right solution together.
                    </p>

                    <div className="mt-8 flex flex-col xl:flex-row justify-center w-full">
                        <a
                            href="#landing-form"
                            className="mb-4 xl:mb-0 mx-2 group relative overflow-hidden bg-[#CCE535] border border-supero-green hover:bg-transparent text-[#2E2E33] hover:text-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[12px] xl:text-[16px] uppercase tracking-wider min-w-[280px] justify-between"
                        >
                            <span className="relative z-10">
                                request consultation
                            </span>

                            <div className="relative w-6 h-6 overflow-hidden transform rotate-90">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
                                >
                                    <path
                                        d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute transition-all duration-300 transform -translate-x-6 translate-y-6 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                                >
                                    <path
                                        d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                        </a>

                        <button
                            onClick={() => setShowModal(true)}
                            className="mx-2 group relative overflow-hidden bg-transparent text-white border border-white hover:bg-[#2E2E33]  hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[12px] xl:text-[16px] uppercase tracking-wider min-w-[280px] justify-between"
                        >
                            <span className="relative z-10">
                                download brochure
                            </span>

                            <div className="relative w-6 h-6 overflow-hidden transform rotate-0">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute transition-all duration-300 transform group-hover:-translate-y-6 group-hover:opacity-0"
                                >
                                    <path
                                        d="M20 18.5V21.5H5V18.5H3.5V21.5C3.5 21.8978 3.65804 22.2794 3.93934 22.5607C4.22064 22.842 4.60218 23 5 23H20C20.3978 23 20.7794 22.842 21.0607 22.5607C21.342 22.2794 21.5 21.8978 21.5 21.5V18.5H20Z"
                                        fill="white"
                                    />
                                    <g clipPath="url(#clip0_269_181)">
                                        <path
                                            d="M18.9425 9.9425L20 11L12.5 18.5L5 11L6.0575 9.9425L11.75 15.6275V2H13.25V15.6275L18.9425 9.9425Z"
                                            fill="white"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_269_181">
                                            <rect
                                                width="15"
                                                height="16.5"
                                                fill="white"
                                                transform="translate(5 2)"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute transition-all duration-300 transform  translate-y-6 opacity-0  group-hover:translate-y-0 group-hover:opacity-100"
                                >
                                    <path
                                        d="M20 18.5V21.5H5V18.5H3.5V21.5C3.5 21.8978 3.65804 22.2794 3.93934 22.5607C4.22064 22.842 4.60218 23 5 23H20C20.3978 23 20.7794 22.842 21.0607 22.5607C21.342 22.2794 21.5 21.8978 21.5 21.5V18.5H20Z"
                                        fill="white"
                                    />
                                    <g clipPath="url(#clip0_269_181)">
                                        <path
                                            d="M18.9425 9.9425L20 11L12.5 18.5L5 11L6.0575 9.9425L11.75 15.6275V2H13.25V15.6275L18.9425 9.9425Z"
                                            fill="white"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_269_181">
                                            <rect
                                                width="15"
                                                height="16.5"
                                                fill="white"
                                                transform="translate(5 2)"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 xl:px-12 bg-supero-dark-grey flex flex-col xl:flex-row flex-wrap">
                <div className="w-full xl:w-1/2 mb-8 xl:mb-0">
                    <p className="text-white opacity-70 text-body-l mb-4">
                        Via Giuseppe Sangiorgi, 15
                    </p>
                    <p className="text-white opacity-70 text-body-l mb-4">
                        70124, Bari (BA) - Italy
                    </p>
                    <p className="text-white opacity-70 text-body-l mb-4">
                        P.IVA 08787910721
                    </p>
                </div>
                <div className="w-full xl:w-1/2 mb-8 xl:mb-0">
                    <a
                        href=""
                        className="block font-semibold text-body-l text-white mb-4"
                    >
                        Youtube
                    </a>
                    <a
                        href=""
                        className="block font-semibold text-body-l text-white mb-4"
                    >
                        LinkedIn
                    </a>
                    <a
                        href=""
                        className="block font-semibold text-body-l text-white mb-4"
                    >
                        Social
                    </a>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-black flex flex-wrap rounded-xl max-w-[95%] lg:max-w-[1200px]  w-full relative max-h-[90vh] xl:h-[830px] overflow-y-scroll">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-2 z-10 "
                        >
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M21.7676 20L32.5 9.26763L30.7324 7.5L20 18.2324L9.26788 7.5L7.5 9.26763L18.2324 20L7.5 30.7324L9.26788 32.5L20 21.7676L30.7324 32.5L32.5 30.7324L21.7676 20Z"
                                    fill="#fff"
                                />
                            </svg>
                        </button>

                        <div
                            className="w-full xl:w-1/2 min-h-[250px] p-8 xl:rounded-tl-xl xl:rounded-bl-xl relative"
                            style={{
                                backgroundImage: `url(${modal})`,
                                backgroundSize:
                                    window.innerWidth > 768
                                        ? '600px 830px'
                                        : 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <p className="xl:hidden title absolute bottom-8">
                                Make <br />
                                Technology <br />
                                Work
                            </p>
                        </div>
                        <div
                            className="w-full xl:w-1/2 p-8"
                            style={{
                                background:
                                    'linear-gradient(0deg, #626271, #2e2e33)',
                            }}
                        >
                            <p className="hidden xl:block title mb-8">
                                Make <br />
                                Technology <br />
                                Work
                            </p>
                            <p className="text-supero-mid-grey uppercase text-body-m mb-12">
                                Download our 4-Step Guide <br /> to Industrial
                                Automation
                            </p>
                            <Formik
                                initialValues={{
                                    name: '',
                                    email: '',

                                    privacy: false,
                                    marketing: false,
                                }}
                                validationSchema={Yup.object({
                                    name: Yup.string().required(
                                        'Name is required'
                                    ),
                                    email: Yup.string()
                                        .email('Invalid email address')
                                        .required('Email is required'),

                                    privacy: Yup.boolean().oneOf(
                                        [true],
                                        'You must accept the privacy policy'
                                    ),
                                    marketing: Yup.boolean(),
                                })}
                                onSubmit={(values, { setSubmitting }) => {
                                    handleSubmit(values);
                                    setSubmitting(false);
                                }}
                            >
                                {({
                                    values,
                                    errors,
                                    touched,
                                    handleChange,
                                    handleBlur,

                                    isSubmitting,
                                    setFieldValue,
                                }) => (
                                    <Form>
                                        <div className="mb-4 w-full px-2">
                                            <label
                                                htmlFor="name"
                                                className="text-[#a6a6ab] text-body-s mb-2 block"
                                            >
                                                Company Name*
                                            </label>
                                            <Field
                                                name="name"
                                                type="text"
                                                placeholder="Insert"
                                                className="w-full bg-[#2E2E33] py-2 px-4 text-white"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="div"
                                                className="text-red-400 text-sm mt-2"
                                            />
                                        </div>

                                        <div className="mb-4 w-full px-2">
                                            <label
                                                htmlFor="email"
                                                className="text-[#a6a6ab] text-body-s mb-2 block"
                                            >
                                                Email *
                                            </label>
                                            <Field
                                                name="email"
                                                type="email"
                                                placeholder="Insert"
                                                className="w-full bg-[#2E2E33] py-2 px-4 text-white"
                                            />
                                            <ErrorMessage
                                                name="email"
                                                component="div"
                                                className="text-red-400 text-sm mt-2"
                                            />
                                        </div>

                                        <div className="mb-8 w-full flex flex-wrap px-2">
                                            <div className="w-full xl:w-1/2">
                                                <div
                                                    className="flex cursor-pointer"
                                                    onClick={() => {
                                                        setFieldValue(
                                                            'privacy',
                                                            !values.privacy
                                                        );
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            className={
                                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                                (values.privacy
                                                                    ? ' bg-slate-400 '
                                                                    : '')
                                                            }
                                                        ></div>
                                                    </div>
                                                    <p className="text-body-s">
                                                        I declared that I have
                                                        read the privacy
                                                        policy*.
                                                    </p>
                                                </div>

                                                <ErrorMessage
                                                    name="privacy"
                                                    component="div"
                                                    className="text-red-400 text-sm mt-2"
                                                />

                                                <div
                                                    className="flex cursor-pointer mt-4"
                                                    onClick={() => {
                                                        setFieldValue(
                                                            'marketing',
                                                            !values.marketing
                                                        );
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            className={
                                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                                (values.marketing
                                                                    ? ' bg-slate-400 '
                                                                    : '')
                                                            }
                                                        ></div>
                                                    </div>
                                                    <p className="text-body-s">
                                                        I agree to receive
                                                        marketing
                                                        communications.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className=" group relative overflow-hidden bg-supero-green hover:bg-transparent text-supero-dark-grey border border-transparent hover:text-supero-green hover:border-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center justify-center text-[16px] uppercase tracking-wider min-w-[250px] w-full xl:w-fit  xl:h-full"
                                        >
                                            <div className="flex">
                                                <span className="relative z-10">
                                                    download guide
                                                </span>

                                                <div className="relative w-6 h-6 overflow-hidden transform rotate-90 ms-5">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
                                                    >
                                                        <path
                                                            d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="absolute transition-all duration-300 transform -translate-x-6 translate-y-6 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                                                    >
                                                        <path
                                                            d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                                            fill="currentColor"
                                                            className="group-hover:fill-supero-green"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
