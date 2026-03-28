export function jsonLdString(data) {
    // Prevent `</script>` injection by escaping `<` characters.
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationJsonLd({ url }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SUPERO',
        url,
        description:
            'AI-driven software solutions for industrial robotics and advanced surface finishing workflows.',
    };
}

export function websiteJsonLd({ url }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'SUPERO',
        url,
    };
}

export function webPageJsonLd({ url, name, description, lang, image }) {
    const json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url,
        name,
        description,
    };
    if (lang) json.inLanguage = lang;
    if (image) json.image = image;
    return json;
}

export function blogPostingJsonLd({
    url,
    headline,
    description,
    image,
    datePublished,
    dateModified,
    lang,
    keywords,
    siteUrl,
    publisherLogoUrl,
}) {
    const org = {
        '@type': 'Organization',
        name: 'SUPERO',
    };
    if (siteUrl) org.url = siteUrl;

    const publisher = { ...org };
    if (publisherLogoUrl) {
        publisher.logo = {
            '@type': 'ImageObject',
            url: publisherLogoUrl,
        };
    }

    const json = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline,
        description,
        author: org,
        publisher,
        url,
    };
    if (lang) json.inLanguage = lang;
    if (image) json.image = Array.isArray(image) ? image : [image];
    if (datePublished) json.datePublished = datePublished;
    if (dateModified) json.dateModified = dateModified;
    if (keywords && keywords.length) json.keywords = keywords;
    return json;
}

export function productJsonLd({ url, name, description, image, brandName }) {
    const json = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        url,
        name,
        description,
        brand: { '@type': 'Brand', name: brandName || 'SUPERO' },
    };
    if (image) json.image = Array.isArray(image) ? image : [image];
    return json;
}
