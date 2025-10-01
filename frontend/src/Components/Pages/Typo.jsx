import Typography from '../Atoms/Typography';

export default function Typo() {
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
            {remapped.map((el, i) => (
                <div key={i} className="mb-12">
                    <p>{el}</p>
                    <div className="pl-12">
                        <Typography
                            tag={'h1'}
                            variant={'big'}
                            classes={'text-' + el}
                        >
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </Typography>
                        <Typography
                            tag={'p'}
                            variant={'normal'}
                            classes={'text-' + el}
                        >
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </Typography>
                        <Typography
                            tag={'p'}
                            variant={'small'}
                            classes={'text-' + el}
                        >
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </Typography>
                    </div>
                </div>
            ))}
        </div>
    );
}
