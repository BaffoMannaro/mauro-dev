/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'selector',
    theme: {
        extend: {
            colors: {
                'primary-dark': {
                    50: '#f0f6ff',
                    100: '#e0ecfe',
                    200: '#bad9fd',
                    300: '#7cbbfd',
                    400: '#3798f9',
                    500: '#0d7bea',
                    600: '#015fc8',
                    700: '#024ba2',
                    800: '#064186',
                    900: '#0c386e',
                    950: '#020913',
                },
                'primary-light': {
                    50: '#f6f6f6',
                    100: '#e7e7e7',
                    200: '#d1d1d1',
                    300: '#b0b0b0',
                    400: '#888888',
                    500: '#6d6d6d',
                    600: '#5d5d5d',
                    700: '#4f4f4f',
                    800: '#454545',
                    900: '#3d3d3d',
                    950: '#0b0b0b',
                },
                // remap of esa brand identity colors, from lighter to darker. eg esa "DEEP-SPACE-2" remaps to deep-space-0
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
                'neutral-space': '#e8e8e3',
            },
        },
    },
    plugins: [],
    safelist: [
        {
            pattern:
                /(bg|text|border)-(deep-space|excite-red|trusty-azure|enlight-yellow|pure-teal)-(0|1|2|3)/,
            variants: ['hover', 'focus', 'disabled'],
        },
    ],
};
