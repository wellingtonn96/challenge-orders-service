import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ReceiveOrderUseCase } from './receive-order.use-case';
import type { ReceiveOrderCommand } from './receive-order.command';
import type { OrderRepository } from '../../domain/order-repository.port';
import { OrderStatus } from '../../domain/order.entity';
import type { Order } from '../../domain/order.entity';
import type { MessageBus } from '../../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../../shared/messaging/messaging.constants';

describe('ReceiveOrderUseCase', () => {
  const command: ReceiveOrderCommand = {
    externalOrderId: 'ext-123',
    customer: { email: 'user@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
    idempotencyKey: 'key-1',
  };

  const existingOrder = {
    id: 'order-1',
    idempotencyKey: 'key-1',
    status: OrderStatus.RECEIVED,
  } as Order;

  const orderRepository = {
    findByIdempotencyKey: jest.fn<(key: string) => Promise<Order | null>>(),
    create: jest.fn<(data: unknown) => Promise<Order>>(),
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

    const result = await useCase.execute(command);

    expect(result).toBe(existingOrder);
    expect(orderRepository.create).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('creates order and publishes to orders queue', async () => {
    orderRepository.findByIdempotencyKey.mockResolvedValue(null);
    orderRepository.create.mockResolvedValue(existingOrder);

    const result = await useCase.execute(command);

    expect(orderRepository.create).toHaveBeenCalledWith(command);
    expect(messageBus.publish).toHaveBeenCalledWith(MessageQueues.ORDERS, {
      orderId: existingOrder.id,
    });
    expect(result).toBe(existingOrder);
  });
});
