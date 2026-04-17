export type PwaInstallState = {
  supported: boolean;
  installed: boolean;
  canInstall: boolean;
  instructions: string | null;
};

const defaultState: PwaInstallState = {
  supported: false,
  installed: false,
  canInstall: false,
  instructions: null,
};

export function registerWebPwa() {
  return defaultState;
}

export function subscribeToPwaInstallState(listener: (state: PwaInstallState) => void) {
  listener(defaultState);

  return () => undefined;
}

export async function promptPwaInstall() {
  return false;
}