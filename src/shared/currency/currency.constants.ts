/** Frankfurter — API gratuita de câmbio via HTTP, sem API key. */
export const CURRENCY_API_BASE_URL =
  process.env.CURRENCY_API_BASE_URL ?? 'https://api.efrankfurter.dev';

export const DEFAULT_TARGET_CURRENCY =
  process.env.DEFAULT_TARGET_CURRENCY ?? 'BRL';

export const FX_RETRY_ATTEMPTS = Number(process.env.FX_RETRY_ATTEMPTS ?? 3);
export const FX_RETRY_BASE_MS = Number(process.env.FX_RETRY_BASE_MS ?? 200);
export const FX_RETRY_MAX_MS = Number(process.env.FX_RETRY_MAX_MS ?? 2000);
