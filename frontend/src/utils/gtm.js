/**
 * Google Tag Manager utility functions
 * Ensures dataLayer is initialized and provides methods to push events
 */

// Initialize dataLayer if it doesn't exist
window.dataLayer = window.dataLayer || [];

/**
 * Push an event to Google Tag Manager dataLayer
 * @param {string} eventName - The name of the event
 * @param {Object} eventData - Additional data to send with the event
 */
export const pushToDataLayer = (eventName, eventData = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
};

/**
 * Track a page view
 * @param {string} path - The current pathname
 * @param {string} title - Optional page title
 */
export const trackPageView = (path, title = '') => {
  pushToDataLayer('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

/**
 * Track a custom event
 * @param {string} eventName - The name of the custom event
 * @param {Object} eventData - Additional data for the event
 */
export const trackEvent = (eventName, eventData = {}) => {
  pushToDataLayer(eventName, eventData);
};

