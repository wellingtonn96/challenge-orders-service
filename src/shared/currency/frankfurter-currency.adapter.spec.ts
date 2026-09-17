import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AxiosError } from 'axios';
import { FrankfurterCurrencyAdapter } from './frankfurter-currency.adapter';
import type { AxiosInstance } from 'axios';

describe('FrankfurterCurrencyAdapter', () => {
  const http = {
    get: jest.fn<(url: string) => Promise<{ data: unknown }>>(),
  };
  let adapter: FrankfurterCurrencyAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    adapter = new FrankfurterCurrencyAdapter(http as unknown as AxiosInstance);
  });

  it('returns same amount with rate 1 when currencies match', async () => {
    const result = await adapter.convert({
      amount: 10,
      from: 'BRL',
      to: 'BRL',
    });

    expect(result).toMatchObject({
      amount: 10,
      from: 'BRL',
      to: 'BRL',
      convertedAmount: 10,
      rate: 1,
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('calls Frankfurter HTTP API and converts amount', async () => {
    http.get.mockResolvedValue({
      data: {
        date: '2026-09-16',
        base: 'USD',
        quote: 'BRL',
        rate: 5.1234,
      },
    });

    const result = await adapter.convert({
      amount: 10,
      from: 'usd',
      to: 'brl',
    });

    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/v2/rate/USD/BRL'),
    );
    expect(result.convertedAmount).toBe(51.234);
    expect(result.rate).toBe(5.1234);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('BRL');
  });

  it('retries transient HTTP failures then succeeds', async () => {
    jest.useFakeTimers();
    http.get
      .mockRejectedValueOnce(
        new AxiosError('Service Unavailable', 'ERR', undefined, undefined, {
          status: 503,
          data: {},
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as never,
        }),
      )
      .mockResolvedValueOnce({
        data: {
          date: '2026-09-16',
          base: 'USD',
          quote: 'BRL',
          rate: 5,
        },
      });

    const promise = adapter.convert({ amount: 10, from: 'USD', to: 'BRL' });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(result.convertedAmount).toBe(50);
  });

  it('does not retry non-transient HTTP errors', async () => {
    http.get.mockRejectedValue(
      new AxiosError('Not Found', 'ERR', undefined, undefined, {
        status: 404,
        data: {},
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
      }),
    );

    await expect(
      adapter.convert({ amount: 10, from: 'USD', to: 'BRL' }),
    ).rejects.toBeInstanceOf(AxiosError);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('rejects negative amounts', async () => {
    await expect(
      adapter.convert({ amount: -1, from: 'USD', to: 'BRL' }),
    ).rejects.toThrow('Amount must be greater than or equal to zero');
  });

  it('rejects responses without a numeric rate', async () => {
    http.get.mockResolvedValue({
      data: { date: '2026-09-16', base: 'USD', quote: 'BRL' },
    });

    await expect(
      adapter.convert({ amount: 10, from: 'USD', to: 'BRL' }),
    ).rejects.toThrow('Exchange rate not available for USD -> BRL');
  });
});
