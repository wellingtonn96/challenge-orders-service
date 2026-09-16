import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ReceiveOrderUseCase } from './receive-order.use-case';
import type { ReceiveOrderDto } from '../dto/receive-order.schema';
import { OrderStatus } from '../entities/order.entity';
import type { Order } from '../entities/order.entity';
import type { OrderRepository } from '../infrastructure/order.repository';
import type { MessageBus } from '../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../shared/messaging/messaging.constants';

describe('ReceiveOrderUseCase', () => {
  const payload: ReceiveOrderDto = {
    order_id: 'ext-123',
    customer: { email: 'user@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
    idempotency_key: 'key-1',
  };

  const existingOrder = {
    id: 'order-1',
    idempotencyKey: 'key-1',
    status: OrderStatus.RECEIVED,
  } as Order;

  const orderRepository = {
    findByIdempotencyKey: jest.fn<(key: string) => Promise<Order | null>>(),
    createFromPayload: jest.fn<(payload: ReceiveOrderDto) => Promise<Order>>(),
  };

  const messageBus = {
    publish: jest.fn<(queue: string, message: unknown) => Promise<boolean>>(),
  };

  let useCase: ReceiveOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    messageBus.publish.mockResolvedValue(true);
    useCase = new ReceiveOrderUseCase(
      orderRepository as unknown as OrderRepository,
      messageBus as unknown as MessageBus,
    );
  });

  it('returns existing order without publishing when idempotency key matches', async () => {
    orderRepository.findByIdempotencyKey.mockResolvedValue(existingOrder);

    const result = await useCase.execute(payload);

    expect(result).toBe(existingOrder);
    expect(orderRepository.createFromPayload).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('creates order and publishes to orders queue', async () => {
    orderRepository.findByIdempotencyKey.mockResolvedValue(null);
    orderRepository.createFromPayload.mockResolvedValue(existingOrder);

    const result = await useCase.execute(payload);

    expect(orderRepository.createFromPayload).toHaveBeenCalledWith(payload);
    expect(messageBus.publish).toHaveBeenCalledWith(MessageQueues.ORDERS, {
      orderId: existingOrder.id,
    });
    expect(result).toBe(existingOrder);
  });
});
