import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/gtm';

/**
 * Component to track page views in Google Tag Manager
 * Should be placed in the root of the app
 */
const GTMTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Small delay to ensure GTM is fully loaded
        const timer = setTimeout(() => {
            // Track page view on route change
            trackPageView(location.pathname + location.search);
        }, 100);

        return () => clearTimeout(timer);
    }, [location]);

    return null; // This component doesn't render anything
};

export default GTMTracker;
