import useThemeStore from '../../Stores/themeStore';
import TestChart from '../TEST_COMPONENTS/TestChart';
import { useState } from 'react';
import TestPie from '../TEST_COMPONENTS/TestPie';

export default function Charts() {
    let data1 = [
        {
            label: 'USA',
            value: 2025,
        },
        {
            label: 'China',
            value: 1882,
        },
        {
            label: 'Japan',
            value: 1809,
        },
        {
            label: 'Germany',
            value: 1322,
        },
        {
            label: 'UK',
            value: 1122,
        },
        {
            label: 'France',
            value: 1114,
        },
        {
            label: 'India',
            value: 984,
        },
        {
            label: 'Spain',
            value: 711,
        },
        {
            label: 'Netherlands',
            value: 665,
        },
        {
            label: 'South Korea',
            value: 443,
        },
        {
            label: 'Canada',
            value: 441,
        },
    ];

    const [data, setData] = useState(data1);

    const theme = useThemeStore((state) => state.theme);

    const randomize = () => {
        const data = Array.from({
            length: Math.round(Math.random() * 10 + 4),
        }).map((el, i) => {
            return {
                label: 'Label ' + i,
                value: i * 100 + 30,
            };
        });

        setData(() => data);
    };
    return (
        <div>
            <button onClick={randomize}>Randomize Data</button>
            <div className="w-full flex flex-wrap">
                <div className="w-1/2">
                    <TestChart theme={theme} data={data} id="test1" />
                </div>
                <div className="w-1/2">
                    <TestChart
                        theme={theme}
                        data={[...data].sort((a, b) =>
                            Math.random() < 0.5 ? 1 : -1
                        )}
                        id="test2"
                    />
                </div>
                <div className="w-1/2">
                    <TestPie data={data} id="test3" />
                </div>
            </div>
        </div>
    );
}
