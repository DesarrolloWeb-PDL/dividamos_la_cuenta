const runtimeEnv = typeof globalThis !== 'undefined'
	? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
	: undefined;

export const APP_PUBLIC_URL = runtimeEnv?.EXPO_PUBLIC_APP_PUBLIC_URL?.trim() || 'https://dividamos-la-cuenta.vercel.app/';
export const APP_DISPLAY_NAME = 'Dividamos la Cuenta';
export const APP_HERO_GREETING = 'Hola, Dividamos la Cuenta';
export const APP_TAGLINE = 'La app para dividir gastos sin vueltas.';