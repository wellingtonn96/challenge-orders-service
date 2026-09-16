import type { OrderItem } from './order.entity';

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
}
