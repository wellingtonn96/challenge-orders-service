import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GetOrderUseCase } from './get-order.use-case';
import type { OrderRepository } from '../../domain/order-repository.port';
import type { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order.entity';

describe('GetOrderUseCase', () => {
  const orderRepository = {
    findById: jest.fn<(id: string) => Promise<Order | null>>(),
  };

  let useCase: GetOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetOrderUseCase(
      orderRepository as unknown as OrderRepository,
    );
  });

  it('returns the order when it exists', async () => {
    const order = { id: 'order-1', status: OrderStatus.COMPLETED } as Order;
    orderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute('order-1');

    expect(result).toBe(order);
    expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
  });

  it('throws NotFoundException when order does not exist', async () => {
    orderRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
