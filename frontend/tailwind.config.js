/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'selector',
    theme: {
        
        extend: {
            colors: {
                'supero-green': '#CCE535', 
                'supero-dark-grey': '#2e2e33',
                'supero-mid-grey': '#A6A6AB',
            }
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