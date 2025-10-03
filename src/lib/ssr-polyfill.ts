// SSR polyfill to prevent location errors
if (typeof window === 'undefined') {
  // Polyfill for server-side rendering
  (global as any).location = {
    href: '',
    origin: '',
    hostname: 'localhost',
    pathname: '',
    search: '',
    hash: '',
    assign: () => {},
    replace: () => {},
    reload: () => {},
  };
}