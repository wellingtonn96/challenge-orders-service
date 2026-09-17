import { describe, expect, it } from '@jest/globals';
import { AxiosError } from 'axios';
import { isTransientHttpError } from './is-transient-http-error';

describe('isTransientHttpError', () => {
  it('returns true for network errors without response', () => {
    const error = new AxiosError('Network Error');
    expect(isTransientHttpError(error)).toBe(true);
  });

  it('returns true for 429 and 5xx', () => {
    expect(
      isTransientHttpError(
        new AxiosError('rate limit', 'ERR', undefined, undefined, {
          status: 429,
          data: {},
          statusText: 'Too Many Requests',
          headers: {},
          config: {} as never,
        }),
      ),
    ).toBe(true);

    expect(
      isTransientHttpError(
        new AxiosError('server error', 'ERR', undefined, undefined, {
          status: 503,
          data: {},
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as never,
        }),
      ),
    ).toBe(true);
  });

  it('returns false for 4xx client errors', () => {
    expect(
      isTransientHttpError(
        new AxiosError('not found', 'ERR', undefined, undefined, {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as never,
        }),
      ),
    ).toBe(false);
  });

  it('returns false for non-axios errors', () => {
    expect(isTransientHttpError(new Error('boom'))).toBe(false);
  });
});
