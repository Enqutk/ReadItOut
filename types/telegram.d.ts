declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        MainButton?: { hide: () => void };
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; username?: string };
        };
      };
    };
  }
}

export {};
