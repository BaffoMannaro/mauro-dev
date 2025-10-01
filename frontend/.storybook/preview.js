/** @type { import('@storybook/react').Preview } */
import "../src/index.css";

const preview = {
    parameters: {
        backgrounds: {
            default: "light",
            values: [
                {
                    name: "light",
                    value: "#333",
                },
                {
                    name: "dark",
                    value: "#333",
                },
            ],
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
