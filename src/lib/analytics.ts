// Google Analytics 4 configuration and utilities
export const GA_MEASUREMENT_ID = 'G-ZT9ZYCJF1Z';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: title || document.title,
      page_location: url,
    });
    
    // Also send a page_view event for better tracking
    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: url,
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, parameters);
};

// Track user engagement events
export const trackUserEngagement = (action: string, category: string, label?: string) => {
  trackEvent('user_engagement', {
    event_category: category,
    event_label: label,
    value: action,
  });
};

// Track app-specific events
export const trackAppEvent = (eventName: string, parameters?: Record<string, any>) => {
  trackEvent(eventName, {
    app_name: 'AuraZ',
    ...parameters,
  });
};