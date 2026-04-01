function stripTrailingSlashes(url) {
    return String(url || '').replace(/\/+$/, '');
}

function ensureLeadingSlash(pathname) {
    if (!pathname) return '/';
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function getSiteOrigin() {
    const mode = import.meta.env.MODE;
    const runtimeOrigin =
        typeof window !== 'undefined' && window.location?.origin
            ? stripTrailingSlashes(window.location.origin)
            : '';
    const runtimeHost =
        typeof window !== 'undefined' && window.location?.hostname
            ? window.location.hostname
            : '';

    // Explicit override (useful for CI/prerender/prod)
    const explicit = import.meta.env.VITE_SITE_URL || '';
    if (explicit) return stripTrailingSlashes(explicit);

    // In development, prefer the actual origin you're viewing (localhost, preview, etc.)
    if (mode === 'development') {
        return runtimeOrigin;
    }

    // Even in production builds, local preview should use localhost so it's easy to validate tags.
    if (runtimeOrigin && (runtimeHost === 'localhost' || runtimeHost === '127.0.0.1')) {
        return runtimeOrigin;
    }

    // In production builds, fall back to the configured public URL.
    const prod = import.meta.env.VITE_PROD_URL || '';
    if (prod) return stripTrailingSlashes(prod);

    // Last resort
    return runtimeOrigin;
}

export function siteUrl(pathname = '/') {
    const origin = getSiteOrigin();
    const path = ensureLeadingSlash(pathname);
    if (!origin) return path;
    return `${origin}${path === '/' ? '/' : path}`;
}

export function getBackendOrigin() {
    const raw = stripTrailingSlashes(import.meta.env.VITE_BACKEND_URL || '');
    if (!raw) return '';

    // Common setup in this repo: VITE_BACKEND_URL=http://host:8000/api or /api/
    // Media URLs are usually served from the backend origin, not the /api prefix.
    return raw.replace(/\/api$/i, '');
}

export function backendUrl(pathname = '/') {
    const origin = getBackendOrigin();
    const path = ensureLeadingSlash(pathname);
    if (!origin) return path;
    return `${origin}${path === '/' ? '/' : path}`;
}

export function getDefaultOgImageUrl() {
    const explicit = import.meta.env.VITE_OG_IMAGE_URL || '';
    if (explicit) return explicit;
    // Fallback to a small but valid image present in `public/`.
    return siteUrl('/fav.png');
}
