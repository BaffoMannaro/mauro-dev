import Button from '../Atoms/Button';
import Card from '../Atoms/Card';

export default function Cards() {
    const colors = {
        'deep-space': {
            0: '#8197a6',
            1: '#335e6f',
            2: '#003247',
        },
        'excite-red': {
            0: '#f1666a',
            1: '#ed1b2f',
            2: '#cf1d39',
            3: '#950136',
        },
        'trusty-azure': {
            0: '#6dcff6',
            1: '#009bdb',
            2: '#00619e',
            3: '#1e3378',
        },
        'enlight-yellow': {
            0: '#ffcc4e',
            1: '#fbab18',
            2: '#f47920',
            3: '#a75534',
        },
        'pure-teal': {
            0: '#76c8ae',
            1: '#00ae9d',
            2: '#008e7a',
            3: '#006762',
        },
    };

    const remapped = [];

    for (const key in colors) {
        const nested = colors[key];
        for (const k in nested) {
            remapped.push(key + '-' + k);
        }
    }

    return (
        <div>
            <h1 className="mb-12">All Cards styles</h1>
            <div className="w-full grid grid-cols-3 gap-12">
                {remapped.map((el, i) => (
                    <Card key={i} variant={el}>
                        <p>Example card with variant</p>
                        <p>{el.toUpperCase()}</p>
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Est, unde.
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
