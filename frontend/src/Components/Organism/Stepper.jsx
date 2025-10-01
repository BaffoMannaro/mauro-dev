import { useState } from 'react';
import StepsHeader from '../Molecules/StepsHeader';
import StepsContent from '../Molecules/StepsContent';

export default function Stepper({ steps, initial }) {
    const [active, setActive] = useState(initial);

    return (
        <div className="w-full md:w-3/5 mx-auto mt-24">
            <StepsHeader steps={steps} active={active} setActive={setActive} />
            <StepsContent active={active} />
        </div>
    );
}
