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

export function organizationJsonLdWithDetails({
    url,
    description,
    email,
    telephone,
    address,
    sameAs,
}) {
    const json = organizationJsonLd({ url });
    if (description) json.description = description;
    if (email) json.email = email;
    if (telephone) json.telephone = telephone;

    if (Array.isArray(sameAs) && sameAs.length) {
        json.sameAs = sameAs.filter(Boolean);
    }

    if (address && typeof address === 'object') {
        const addr = {
            '@type': 'PostalAddress',
        };
        if (address.streetAddress) addr.streetAddress = address.streetAddress;
        if (address.addressLocality) addr.addressLocality = address.addressLocality;
        if (address.addressRegion) addr.addressRegion = address.addressRegion;
        if (address.postalCode) addr.postalCode = address.postalCode;
        if (address.addressCountry) addr.addressCountry = address.addressCountry;

        const hasAny = Object.keys(addr).length > 1;
        if (hasAny) json.address = addr;
    }

    if (email || telephone) {
        json.contactPoint = [
            {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                ...(email ? { email } : {}),
                ...(telephone ? { telephone } : {}),
            },
        ];
    }

    return json;
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

export function breadcrumbListJsonLd({ items, lang }) {
    const list = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: (items || []).map((it, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: it.name,
            item: it.url,
        })),
    };
    if (lang) list.inLanguage = lang;
    return list;
}

export function siteNavigationJsonLd({ items, lang }) {
    const list = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: (items || []).map((it) => ({
            '@type': 'SiteNavigationElement',
            name: it.name,
            url: it.url,
        })),
    };
    if (lang) list.inLanguage = lang;
    return list;
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
