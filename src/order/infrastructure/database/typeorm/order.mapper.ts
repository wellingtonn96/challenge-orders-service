import { Order } from '../../../domain/order.entity';
import type { OrderOrmEntity } from './order.orm-entity';

function toNumberOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}

export function toDomainOrder(entity: OrderOrmEntity): Order {
  return new Order({
    id: entity.id,
    externalOrderId: entity.externalOrderId,
    customer: entity.customer,
    items: entity.items,
    currency: entity.currency,
    totalAmount: toNumberOrNull(entity.totalAmount),
    convertedAmount: toNumberOrNull(entity.convertedAmount),
    convertedCurrency: entity.convertedCurrency,
    exchangeRate: toNumberOrNull(entity.exchangeRate),
    idempotencyKey: entity.idempotencyKey,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}
