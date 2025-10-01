import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import useThemeStore from '../../Stores/themeStore';
import { useCallback, useState } from 'react';

const data = [
    {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: 'Page C',
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: 'Page D',
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: 'Page E',
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: 'Page F',
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

export default function LinePlot() {
    const theme = useThemeStore((state) => state.theme);

    const dataKeys = ['pv', 'uv', 'amt'];

    const colorTheme = {
        light: [
            '#f6f6f6',
            '#e7e7e7',
            '#d1d1d1',
            '#b0b0b0',
            '#888888',
        ].reverse(),
        dark: ['#f0f6ff', '#e0ecfe', '#bad9fd', '#7cbbfd', '#3798f9'].reverse(),
    };

    const initialOpacity = Object.fromEntries(dataKeys.map((el) => [el, 1]));
    console.log('initialOpacity', initialOpacity);

    const [opacity, setOpacity] = useState(initialOpacity);

    const handleMouseEnter = useCallback(
        (o) => {
            const { dataKey } = o;
            console.log(opacity);

            const op = Object.fromEntries(
                Object.entries(opacity).map(([key, value]) => {
                    if (key === dataKey) {
                        return [key, 1];
                    } else {
                        return [key, 0.15];
                    }
                })
            );

            setOpacity(op);
        },
        [opacity, setOpacity]
    );

    const handleMouseLeave = useCallback(
        (o) => {
            const { dataKey } = o;
            setOpacity(initialOpacity);
        },
        [opacity, setOpacity]
    );

    const activeTheme = colorTheme[theme];
    const lines = dataKeys.map((el, i) => {
        return (
            <Line
                key={el}
                type="monotone"
                dataKey={el}
                stroke={activeTheme[i]}
                strokeOpacity={opacity[el]}
            />
        );
    });

    return (
        <div style={{ width: '100%', height: '90%' }}>
            {JSON.stringify(opacity)}
            <ResponsiveContainer>
                <LineChart
                    width={500}
                    height={300}
                    data={data}
                    /*  margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }} */
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                    {lines}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
