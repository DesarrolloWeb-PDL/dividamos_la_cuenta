export type PwaInstallState = {
  supported: boolean;
  installed: boolean;
  canInstall: boolean;
  instructions: string | null;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isBootstrapped = false;
let activeRegistration: ServiceWorkerRegistration | null = null;

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const listeners = new Set<(state: PwaInstallState) => void>();

async function triggerServiceWorkerUpdateCheck() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = activeRegistration ?? await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return;
  }

  activeRegistration = registration;

  try {
    await registration.update();

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch {
    return;
  }
}

function bindServiceWorkerRefreshTriggers() {
  if (window.__dividamosUpdateTriggersBound) {
    return;
  }

  window.__dividamosUpdateTriggersBound = true;

  const checkForUpdates = () => {
    void triggerServiceWorkerUpdateCheck();
  };

  window.addEventListener('focus', checkForUpdates);
  window.addEventListener('online', checkForUpdates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
    activeRegistration = registration;
    bindServiceWorkerRefreshTriggers();
    void triggerServiceWorkerUpdateCheck();

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;

      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    if (!window.__dividamosControllerReloadBound) {
      window.__dividamosControllerReloadBound = true;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }).catch(() => undefined);
}

declare global {
  interface Window {
    __dividamosControllerReloadBound?: boolean;
    __dividamosUpdateTriggersBound?: boolean;
  }
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function getInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'En iPhone abrila en Safari y usá Compartir > Agregar a pantalla de inicio.';
  }

  if (userAgent.includes('android')) {
    return 'En Android usá el menú de Chrome y elegí Instalar app o Agregar a pantalla principal.';
  }

  return 'En Chrome abrí el menú del navegador y elegí Instalar app.';
}

function getState(): PwaInstallState {
  return {
    supported: true,
    installed: isInstalled(),
    canInstall: Boolean(deferredPrompt) && !isInstalled(),
    instructions: getInstructions(),
  };
}

function notifyListeners() {
  const state = getState();

  listeners.forEach(listener => {
    listener(state);
  });
}

export function registerWebPwa() {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      installed: false,
      canInstall: false,
      instructions: null,
    };
  }

  if (!isBootstrapped) {
    isBootstrapped = true;

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      notifyListeners();
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      notifyListeners();
    });

    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      notifyListeners();
    };

    if ('addEventListener' in displayModeMediaQuery) {
      displayModeMediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      displayModeMediaQuery.addListener(handleDisplayModeChange);
    }

    registerServiceWorker();
  }

  return getState();
}

export function subscribeToPwaInstallState(listener: (state: PwaInstallState) => void) {
  registerWebPwa();
  listeners.add(listener);
  listener(getState());

  return () => {
    listeners.delete(listener);
  };
}

export async function promptPwaInstall() {
  if (!deferredPrompt) {
    return false;
  }

  const installPrompt = deferredPrompt;
  deferredPrompt = null;

  await installPrompt.prompt();

  try {
    const result = await installPrompt.userChoice;
    notifyListeners();
    return result.outcome === 'accepted';
  } catch {
    notifyListeners();
    return false;
  }
}