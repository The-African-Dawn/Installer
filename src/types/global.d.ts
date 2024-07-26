export {};

declare global {
  interface Window {
    electron: {
      getRegistryValue: () => Promise<string | null>;
      checkRegistryAndDownload: () => Promise<boolean>;
    };
  }
}