declare global {
  interface Window {
    acceptInstall?: () => void;
    dismissInstall?: () => void;
  }
}

export {};

