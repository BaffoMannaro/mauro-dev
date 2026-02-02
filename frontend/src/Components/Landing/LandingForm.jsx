import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import poly from '../../assets/images/poly.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LandingForm() {
    const navigate = useNavigate();

    const { t } = useTranslation();

    const handleSubmit = async (values) => {
        //submit form
        console.log(values);

        const response = await fetch(
            import.meta.env.VITE_BACKEND_URL + 'marketing/contact-form/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...values,
                    recaptcha_token: import.meta.env.VITE_RECAPTCHA_PUBLIC_KEY,
                }),
            }
        );

        if (response.status == 200) {
            navigate('/thank-you-page');
        } else {
            alert('Error submitting form.');
        }
    };

    return (
        <div
            id="landing-form"
            className="w-full flex flex-wrap items-center bg-[#434348] px-4 xl:px-12 pb-24"
            style={{
                backgroundImage: `url(${poly})`,
                backgroundOrigin: 'border-box',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="w-full xl:w-2/5">
                <p className="title mb-6">
                    Does it <br className="hidden xl:block" />{' '}
                    <span className="font-black font-stretch-125">work </span>
                    <br className="hidden xl:block" />
                    for you?
                </p>

                <p className="text-supero-mid-grey text-body-l mt-12 whitespace-pre-line">
                    {t('does_it_work')}
                </p>
            </div>

            <div className="w-full xl:w-3/5 py-4 xl:p-12 text-white">
                <Formik
                    initialValues={{
                        companyName: '',
                        email: '',
                        sanding: false,
                        polishing: false,
                        painting: false,

                        other: false,
                        message: '',
                        productTypes: '',
                        privacy: false,
                        marketing: false,
                    }}
                    validationSchema={Yup.object().shape({
                        companyName: Yup.string().required(
                            t('required_field')
                        ),
                        email: Yup.string()
                            .email(t('invalid_email'))
                            .required(t('required_field')),
                        privacy: Yup.boolean().oneOf(
                            [true],
                            t('accept_privacy')
                        ),
                        marketing: Yup.boolean(),
                        productTypes: Yup.mixed().test(
                            'has-product-selected',
                            t('select_product_type'),
                            function (value) {
                                const {
                                    sanding,
                                    polishing,
                                    painting,

                                    other,
                                } = this.parent;
                                return (
                                    sanding || polishing || painting || other
                                );
                            }
                        ),
                    })}
                    onSubmit={(values, { setSubmitting, resetForm }) => {
                        handleSubmit(values);
                    }}
                >
                    {({ isSubmitting, values, errors, setFieldValue }) => (
                        <Form className="flex flex-wrap xl:p-8 text-white w-full">
                            <div className="mb-8 w-full xl:w-1/2 xl:px-2">
                                <label
                                    htmlFor="companyName"
                                    className="text-[#a6a6ab] text-body-m mb-2 block"
                                >
                                    {t('company_name')}*
                                </label>
                                <Field
                                    name="companyName"
                                    type="text"
                                    placeholder={t('insert')}
                                    className="w-full bg-[#121212] py-2 px-4 "
                                />
                                <ErrorMessage
                                    name="companyName"
                                    component="div"
                                    className="text-red-400 text-sm mt-2"
                                />
                            </div>

                            <div className="mb-8 w-full xl:w-1/2 xl:px-2">
                                <label
                                    htmlFor="email"
                                    className="text-[#a6a6ab] text-body-m mb-2 block"
                                >
                                    Email*
                                </label>
                                <Field
                                    name="email"
                                    type="email"
                                    placeholder={t('insert')}
                                    className="w-full bg-[#121212] py-2 px-4 "
                                />
                                <ErrorMessage
                                    name="email"
                                    component="div"
                                    className="text-red-400 text-sm mt-2"
                                />
                            </div>

                            <div className="mb-8 w-full px-2">
                                <label className="text-[#a6a6ab] text-body-m mb-2 block">
                                    {t('which_product')}
                                </label>

                                <div className="flex justify-between flex-wrap ">
                                    <div
                                        className="flex items-center cursor-pointer w-1/2 lg:w-1/4 mb-6"
                                        onClick={() => {
                                            setFieldValue(
                                                'sanding',
                                                !values.sanding
                                            );
                                        }}
                                    >
                                        <div
                                            className={
                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                (values.sanding
                                                    ? ' bg-slate-400 '
                                                    : '')
                                            }
                                        ></div>
                                        <p>{t('sanding')}</p>
                                    </div>

                                    <div
                                        className="flex items-center cursor-pointer w-1/2 lg:w-1/4 mb-6"
                                        onClick={() => {
                                            setFieldValue(
                                                'polishing',
                                                !values.polishing
                                            );
                                        }}
                                    >
                                        <div
                                            className={
                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                (values.polishing
                                                    ? ' bg-slate-400 '
                                                    : '')
                                            }
                                        ></div>
                                        <p>{t('polishing')}</p>
                                    </div>

                                    <div
                                        className="flex items-center cursor-pointer w-1/2 lg:w-1/4 mb-6"
                                        onClick={() => {
                                            setFieldValue(
                                                'painting',
                                                !values.painting
                                            );
                                        }}
                                    >
                                        <div
                                            className={
                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                (values.painting
                                                    ? ' bg-slate-400 '
                                                    : '')
                                            }
                                        ></div>
                                        <p>{t('painting')}</p>
                                    </div>

                                    <div
                                        className="flex items-center cursor-pointer w-1/2 lg:w-1/4 mb-6"
                                        onClick={() => {
                                            setFieldValue(
                                                'other',
                                                !values.other
                                            );
                                        }}
                                    >
                                        <div
                                            className={
                                                'h-5 w-5 border rounded-sm me-3 ' +
                                                (values.other
                                                    ? ' bg-slate-400 '
                                                    : '')
                                            }
                                        ></div>
                                        <p>{t('other')}</p>
                                    </div>
                                </div>

                                <ErrorMessage
                                    name="productTypes"
                                    component="div"
                                    className="text-red-400 text-sm mt-2"
                                />
                            </div>

                            <div className="mb-8 w-full">
                                <label
                                    htmlFor="message"
                                    className="text-[#a6a6ab] text-body-m mb-2 block"
                                >
                                    {t('tell_us')}
                                </label>
                                <Field
                                    name="message"
                                    as="textarea"
                                    rows="4"
                                    placeholder={t('write_something')}
                                    className="w-full bg-[#121212] py-2 px-4 resize-none"
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
                                            {t('privacy_policy_prefix')}
                                            <a
                                                href="https://www.iubenda.com/privacy-policy/23263641"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {t('privacy_policy_link')}
                                            </a>*.
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
                                            {t('marketing_consent')}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full xl:w-1/2 mt-6 xl:mt-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="mx-auto xl:ml-auto xl:mr-0 group relative overflow-hidden bg-supero-green hover:bg-transparent text-supero-dark-grey border border-transparent hover:text-supero-green hover:border-supero-green px-4 py-2.5 transition-all duration-300 font-extrabold flex items-center justify-center text-[16px] uppercase tracking-wider min-w-[250px] h-24 xl:h-full"
                                    >
                                        <div className="flex">
                                            <span className="relative z-10">
                                                {t('send')}
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
                                                        className="group-hover:fill-supero-green"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
