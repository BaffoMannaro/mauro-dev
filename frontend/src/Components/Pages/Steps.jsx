import Stepper from '../Organism/Stepper';
import { Tooltip } from 'react-tooltip';

export default function Steps() {
    const fakeStep = [
        {
            name: 'Admin',
        },
        {
            name: 'Labour',
        },
        {
            name: 'Overheads',
        },
    ];
    return (
        <div>
            Component Stepper takes a list of steps (each with prop name) and an
            initial step (0-based). These are prop-drilled to organisms
            StepsHeader && StepsContent
            <Stepper steps={fakeStep} initial={1} />
            <Tooltip id="my-tooltip">
                <div className="w-48 ">
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Enim, at. Lorem ipsum dolor sit amet consectetur,
                        adipisicing elit. Dolores fugiat minus ex at aliquid
                        optio quis vero doloribus voluptas expedita sequi,
                        molestias soluta cumque modi mollitia. Quas quae soluta
                        provident perferendis nemo inventore eius molestias
                        distinctio? Facere ducimus ad a?
                    </p>
                    <ul className="">
                        <li>* Lorem</li>
                        <li>* Ipsum</li>
                        <li>* Dolor</li>
                    </ul>
                </div>
            </Tooltip>
            <span data-tooltip-id="my-tooltip" data-tooltip-place="right">
                asd
            </span>
        </div>
    );
}
