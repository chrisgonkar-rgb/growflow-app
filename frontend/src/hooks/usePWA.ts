// Growflow PWA Hook
// © TrueNorth Group of Companies Ltd.

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    setState(prev => ({ ...prev, isStandalone }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        deferredPrompt: e as BeforeInstallPromptEvent,
        isInstallable: true,
      }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!state.deferredPrompt) {
      return { success: false, error: 'App is not installable' };
    }

    // Show the install prompt
    state.deferredPrompt.prompt();

    // Wait for user choice
    const choiceResult = await state.deferredPrompt.userChoice;

    // Clear the deferred prompt
    setState(prev => ({
      ...prev,
      deferredPrompt: null,
      isInstallable: false,
    }));

    if (choiceResult.outcome === 'accepted') {
      return { success: true };
    } else {
      return { success: false, error: 'User dismissed the install prompt' };
    }
  }, [state.deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInstallable: false,
    }));
  }, []);

  return {
    ...state,
    installApp,
    dismissInstall,
  };
}

// Check if device is mobile
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

// Check if device is desktop
export function isDesktop(): boolean {
  return !isMobile();
}
