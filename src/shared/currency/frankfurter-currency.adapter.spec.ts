import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FrankfurterCurrencyAdapter } from './frankfurter-currency.adapter';
import type { AxiosInstance } from 'axios';

describe('FrankfurterCurrencyAdapter', () => {
  const http = {
    get: jest.fn<(url: string) => Promise<{ data: unknown }>>(),
  };
  let adapter: FrankfurterCurrencyAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
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
