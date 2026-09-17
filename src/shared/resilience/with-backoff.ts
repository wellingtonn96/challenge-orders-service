export type BackoffOptions = {
  retries: number;
  baseMs: number;
  maxMs: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions,
): Promise<T> {
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === options.retries || !shouldRetry(error)) {
        break;
      }

      const delayMs = Math.min(
        options.baseMs * 2 ** attempt,
        options.maxMs,
      );
      options.onRetry?.(error, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
