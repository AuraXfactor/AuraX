// SSR-safe utilities to prevent location errors during server-side rendering

export const isClient = typeof window !== 'undefined';

export const getLocation = () => {
  if (isClient) {
    return window.location;
  }
  return null;
};

export const getLocationOrigin = () => {
  if (isClient) {
    return window.location.origin;
  }
  return '';
};

export const getLocationHostname = () => {
  if (isClient) {
    return window.location.hostname;
  }
  return 'localhost';
};

export const navigateTo = (url: string) => {
  if (isClient) {
    window.location.href = url;
  }
};