import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { JoiValidationPipe } from '../../shared/pipes/joi-validation.pipe';
import { receiveOrderSchema } from './receive-order.schema';

const validPayload = {
  order_id: 'ext-123',
  customer: { email: 'user@example.com', name: 'Ana' },
  items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
  currency: 'USD',
  idempotency_key: 'uuid-or-hash',
};

describe('receiveOrderSchema', () => {
  const pipe = new JoiValidationPipe(receiveOrderSchema);

  it('accepts a valid payload', () => {
    expect(pipe.transform(validPayload, {} as never)).toEqual(validPayload);
  });

  it('rejects invalid email', () => {
    expect(() =>
      pipe.transform(
        {
          ...validPayload,
          customer: { ...validPayload.customer, email: 'invalid' },
        },
        {} as never,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects missing items', () => {
    const { items: _items, ...withoutItems } = validPayload;

    expect(() => pipe.transform(withoutItems, {} as never)).toThrow(
      BadRequestException,
    );
  });

  it('rejects currency with invalid length', () => {
    expect(() =>
      pipe.transform({ ...validPayload, currency: 'US' }, {} as never),
    ).toThrow(BadRequestException);
  });
});
