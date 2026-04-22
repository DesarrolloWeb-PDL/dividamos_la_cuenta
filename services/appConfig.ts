const runtimeEnv = typeof globalThis !== 'undefined'
	? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
	: undefined;

export const APP_PUBLIC_URL = runtimeEnv?.EXPO_PUBLIC_APP_PUBLIC_URL?.trim() || 'https://dividamos-la-cuenta.vercel.app/';
export const APP_DISPLAY_NAME = 'DIVIDAMOS LA CUENTA';
export const APP_TAGLINE = 'Cuentas claras conservan la amistad';