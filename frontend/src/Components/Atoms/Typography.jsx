export default function Typography({ children, tag, variant, classes }) {
    const tagMapping = {
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
        p: 'p',
    };

    const Component = tag ? tagMapping[tag] : 'p';

    const variantMapping = {
        big: 'text-3xl',
        medium: 'text-md',
        small: 'text-xs',
    };

    return (
        <Component className={`${variantMapping[variant]} ${classes}`}>
            {children}
        </Component>
    );
}
