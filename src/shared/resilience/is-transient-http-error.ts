import { isAxiosError } from 'axios';

export function isTransientHttpError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 429 || status >= 500;
}
