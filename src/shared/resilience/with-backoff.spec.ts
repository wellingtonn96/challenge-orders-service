import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { withBackoff } from './with-backoff';

describe('withBackoff', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns on first success', async () => {
    const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');

    await expect(withBackoff(fn, { retries: 3, baseMs: 10, maxMs: 100 })).resolves.toBe(
      'ok',
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures then succeeds', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue('ok');

    const promise = withBackoff(fn, { retries: 3, baseMs: 100, maxMs: 1000 });
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops when shouldRetry returns false', async () => {
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('bad request'));

    await expect(
      withBackoff(fn, {
        retries: 3,
        baseMs: 10,
        maxMs: 100,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('still down'));

    const promise = withBackoff(fn, {
      retries: 2,
      baseMs: 50,
      maxMs: 200,
      shouldRetry: () => true,
    });
    const expectation = expect(promise).rejects.toThrow('still down');
    await jest.runAllTimersAsync();
    await expectation;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
