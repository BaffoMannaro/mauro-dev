import { Formik, Field, Form, FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import Input from '../Molecules/Input';
import Button from '../Atoms/Button';

export default function FormFieldArray() {
    return (
        <Formik
            initialValues={{
                labours: [
                    {
                        name: '',
                        fte: '',
                        cost: '',
                        confirm: '',
                    },
                    {
                        name: '',
                        fte: '',
                        cost: '',
                        confirm: '',
                    },
                ],
            }}
            validateOnMount
            validationSchema={Yup.object({
                labours: Yup.array()
                    .of(
                        Yup.object({
                            name: Yup.string()
                                .min(4, 'Too short')
                                .required('Required'),
                            /*  fte: Yup.string()
                                .test(
                                    'is-decimal',
                                    'The amount should be a decimal with maximum two digits after comma',
                                    (val) => {
                                        if (val != undefined) {
                                            return /^\d+(\.\d{0,2})?$/.test(
                                                val
                                            );
                                        }
                                        return true;
                                    }
                                )

                                .min(0, 'Min 0')
                                .max(10, 'Max 10')
                                .required('Required'), */
                            fte: Yup.number()
                                .min(
                                    0,
                                    'Number must be greater than or equal to 0'
                                )
                                .max(
                                    5,
                                    'Number must be less than or equal to 5'
                                )
                                .positive('Number must be positive')
                                .typeError('Invalid number')
                                .test(
                                    'decimal',
                                    'Maximum of two decimal digits allowed',
                                    (value) =>
                                        value === undefined ||
                                        value === null ||
                                        /^\d+(\.\d{1,2})?$/.test(value)
                                )
                                .required('Required'),

                            cost: Yup.number()
                                .min(0, 'Bust be positive')
                                .max(10000, 'Max 10000')
                                .required('Required'),
                            confirm: Yup.boolean().test(
                                'requiredIfCostZero',
                                'Must accept this',
                                function (value) {
                                    const cost = this.parent.cost || 0;
                                    return cost === 0 ? value === true : true;
                                }
                            ),
                        })
                    )
                    .required('Must have labours')
                    .min(2, 'Minimum of 2 labours')
                    .max(5, 'Max of 5 labours'),
            })}
            onSubmit={(values) => console.log(values)}
        >
            {({ values, errors }) => (
                <div className="w-4/5 mx-auto">
                    <Form className="flex flex-wrap rounded-lg bg-slate-50 p-8 text-black shadow dark:bg-gray-900  w-full mt-8">
                        <div className="w-full text-center">
                            <h1 className="text-black dark:text-white mb-12">
                                Field array
                            </h1>
                        </div>

                        {/* {JSON.stringify(errors)} */}
                        <FieldArray
                            name="labours"
                            render={(arrayHelpers) => (
                                <div className="w-full">
                                    {values.labours.map((friend, index) => (
                                        <div
                                            className="mb-8 w-full"
                                            key={index}
                                        >
                                            <div className="flex gap-2 w-full">
                                                {values.labours.length > 2 && (
                                                    <div className="w-1/12">
                                                        <button
                                                            className="flex justify-center items-center w-8 h-8 rounded-full shadow-lg relative top-4 text-red-600 hover:bg-red-600 hover:text-white"
                                                            onClick={() =>
                                                                arrayHelpers.remove(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="w-1/5">
                                                    <Field
                                                        name={`labours[${index}].name`}
                                                        component={Input}
                                                        label="Labour category name"
                                                        type="text"
                                                    />
                                                    <div className="text-red-500 font-bold">
                                                        <ErrorMessage
                                                            name={`labours[${index}].name`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-1/5">
                                                    <Field
                                                        name={`labours.${index}.fte`}
                                                        component={Input}
                                                        label="Number of FTE Equivalent"
                                                        type="text"
                                                    />
                                                    <div className="text-red-500 font-bold">
                                                        <ErrorMessage
                                                            name={`labours[${index}].fte`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-1/5">
                                                    <Field
                                                        name={`labours.${index}.cost`}
                                                        component={Input}
                                                        label="Staff Cost"
                                                        type="number"
                                                    />
                                                    <div className="text-red-500 font-bold">
                                                        <ErrorMessage
                                                            name={`labours[${index}].cost`}
                                                        />
                                                    </div>
                                                </div>
                                                {values.labours[index].cost ===
                                                    0 && (
                                                    <div className="w-1/5 px-4">
                                                        <label>
                                                            Confirm this is zero
                                                            <Field
                                                                type="checkbox"
                                                                name={`labours[${index}].confirm`}
                                                            />
                                                        </label>
                                                        <div className="text-red-500 font-bold">
                                                            <ErrorMessage
                                                                name={`labours[${index}].confirm`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-left">
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                arrayHelpers.push({
                                                    name: '',
                                                    fte: '',
                                                    cost: '',
                                                    confirm: '',
                                                })
                                            }
                                            variant={'trusty-azure-1'}
                                        >
                                            Add more{' '}
                                            <i className="fal fa-plus ml-6"></i>
                                        </Button>
                                    </div>
                                    {typeof errors.labours === 'string' ? (
                                        <div>{errors.labours}</div>
                                    ) : (
                                        ''
                                    )}
                                </div>
                            )}
                        />

                        <div className="w-full text-center mt-48">
                            <Button
                                type={'submit'}
                                variant={'trusty-azure-1'}
                                fill
                            >
                                Save
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
        </Formik>
    );
}

const ErrorMessage = ({ name }) => (
    <Field
        name={name}
        render={({ form }) => {
            const error = getIn(form.errors, name);
            const touch = true; //getIn(form.touched, name);
            return touch && error ? error : null;
        }}
    />
);
