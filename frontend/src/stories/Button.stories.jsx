import Button from '../Components/Atoms/Button';

export default {
    title: 'Example/Button',
    component: Button,
    argTypes: {
        onClick: { action: 'clicked' },
        variant: {
            control: {
                type: 'select',
                options: ['primary', 'secondary', 'danger'],
            },
        },
        fill: {
            control: 'boolean',
        },
    },
};

const Template = (args) => <Button {...args} />;

export const DeepSpace0 = Template.bind({});
export const DeepSpace1 = Template.bind({});

DeepSpace0.args = {
    children: 'deep-space-0',
    variant: 'deep-space-0',
    fill: true,
    type: 'button',
    disabled: false,
};

DeepSpace1.args = {
    children: 'deep-space-1',
    variant: 'deep-space-1',
    fill: true,
    type: 'button',
    disabled: false,
};
