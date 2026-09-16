/** Frankfurter — API gratuita de câmbio via HTTP, sem API key. */
export const CURRENCY_API_BASE_URL =
  process.env.CURRENCY_API_BASE_URL ?? 'https://api.frankfurter.dev';

export const DEFAULT_TARGET_CURRENCY =
  process.env.DEFAULT_TARGET_CURRENCY ?? 'BRL';
