import { describe, expect, it } from '@jest/globals';
import { calculateOrderTotal } from './calculate-total';

describe('calculateOrderTotal', () => {
  it('sums qty * unit_price for all items', () => {
    const total = calculateOrderTotal([
      { sku: 'A', qty: 2, unit_price: 10 },
      { sku: 'B', qty: 1, unit_price: 5.5 },
    ]);

    expect(total).toBe(25.5);
  });

  it('returns 0 for an empty list', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});
