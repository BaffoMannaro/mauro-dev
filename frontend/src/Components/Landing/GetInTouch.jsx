import { Slide } from 'react-awesome-reveal';
import * as Yup from 'yup';

import blockLeft from '../../../src/assets/images/block-left.png';
import blockRight from '../../../src/assets/images/block-right.png';
import { Form, Formik } from 'formik';

export default function GetInTouch() {
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
                        Get in <span className="font-black">touch</span>
                    </p>

                    <p className="text-supero-mid-grey text-body-l text-center">
                        Ready to see how collaborative robotics can transform
                        your production? <br /> Let’s talk about your challenges
                        and design the right solution together.
                    </p>

                    <div className="mt-8 flex flex-col xl:flex-row justify-center w-full">
                        <button className="mb-4 xl:mb-0 mx-2 group relative overflow-hidden bg-[#CCE535] hover:bg-[#2E2E33] text-[#2E2E33] hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[12px] xl:text-[16px] uppercase tracking-wider min-w-[280px] justify-between">
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
                        </button>

                        <button className="mx-2 group relative overflow-hidden bg-transparent text-white border border-white hover:bg-[#2E2E33]  hover:text-white px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center text-[12px] xl:text-[16px] uppercase tracking-wider min-w-[280px] justify-between">
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
                                    className="absolute transition-all duration-300 transform group-hover:translate-x-6 group-hover:-translate-y-6 group-hover:opacity-0"
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
                                    className="absolute transition-all duration-300 transform -translate-x-6 translate-y-6 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
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

            <div className="w-full px-12 bg-supero-dark-grey flex flex-col xl:flex-row flex-wrap">
                <div className="w-full xl:w-1/3 mb-8 xl:mb-0">
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
                <div className="w-full xl:w-1/3 mb-8 xl:mb-0">
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
                <div className="w-full xl:w-1/3 mb-8 xl:mb-0">
                    <p className=" text-body-m mb-2">
                        Subscribe to the newsletter
                    </p>

                    <Formik
                        initialValues={{ email: '' }}
                        validationSchema={Yup.object({
                            email: Yup.string()
                                .email('Invalid email address')
                                .required('This field is required'),
                        })}
                        onSubmit={(values, { setSubmitting, resetForm }) => {
                            console.log(values);
                            setSubmitting(false);
                            resetForm();
                        }}
                    >
                        {({ isSubmitting, values, errors, setFieldValue }) => (
                            <Form className="w-full">
                                <div className="flex">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email*"
                                        className="w-full px-4 py-2.5 bg-[#434348] text-white rounded-l-sm focus:outline-none focus:ring-2 focus:ring-supero-green"
                                        value={values.email}
                                        onChange={(e) =>
                                            setFieldValue(
                                                'email',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="group relative overflow-hidden bg-supero-green hover:bg-supero-dark-grey text-supero-dark-grey border border-transparent hover:text-white hover:border-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center justify-center text-[12px] uppercase tracking-wider rounded-r-sm"
                                    >
                                        <span className="relative z-10">
                                            subscribe
                                        </span>
                                    </button>
                                </div>
                                {errors.email ? (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.email}
                                    </div>
                                ) : null}
                            </Form>
                        )}
                    </Formik>

                    <p className="text-body-s opacity-70 mt-2">
                        The information you provide through this form will be
                        used in accordance with our privacy policy. If you wish
                        to change or remove any information you provide through
                        this form, please email tech@g-nous.com.
                    </p>
                </div>
            </div>
        </>
    );
}
