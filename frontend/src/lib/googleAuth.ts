const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Auth script'));
    document.head.appendChild(script);
  });
};

export const initializeGoogleAuth = async (): Promise<void> => {
  await loadGoogleScript();
  
  return new Promise((resolve, reject) => {
    window.google?.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        resolve(response.credential);
      },
      auto_select: false,
    });
    resolve();
  });
};

export const renderGoogleButton = (buttonElement: HTMLElement, onSuccess: (credential: string) => void): void => {
  window.google?.accounts.id.renderButton(buttonElement, {
    theme: 'outline',
    size: 'large',
    width: '100%',
    text: 'continue_with',
  });
  
  window.google?.accounts.id.prompt((notification: any) => {
    if (notification.isNotDisplayed()) {
      console.log('Google One Tap not displayed');
    }
  });
};

export const signInWithGoogle = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.google?.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('Google authentication failed'));
        }
      },
      auto_select: false,
    });
    
    window.google?.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkipped()) {
        reject(new Error('Google authentication cancelled'));
      }
    });
  });
};

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
