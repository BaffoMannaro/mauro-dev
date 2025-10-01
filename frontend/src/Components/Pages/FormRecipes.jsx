import FormFieldArray from '../FormRecipes/FormFieldArray';
import FormFile from '../FormRecipes/FormFile';
import FormMultiSelect from '../FormRecipes/FormMultiSelect';
import FormObserverDebouncer from '../FormRecipes/FormObserverDeboucer';
import FormPrefill from '../FormRecipes/FormPrefill';

export default function FormRecipes() {
    return (
        <div>
            <div className="mt-12 mb-96">
                <FormMultiSelect />
            </div>
            <div className="mt-12 mb-96">
                <FormFile />
            </div>

            <div className="mt-12 mb-96">
                <FormFieldArray />
            </div>

            <FormObserverDebouncer />
            <FormPrefill />
        </div>
    );
}
