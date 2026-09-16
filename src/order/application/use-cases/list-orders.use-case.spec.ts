import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ListOrdersUseCase } from './list-orders.use-case';
import type {
  FindOrdersParams,
  OrderRepository,
  PaginatedOrders,
} from '../../domain/order-repository.port';
import type { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order.entity';

describe('ListOrdersUseCase', () => {
  const orderRepository = {
    findAll: jest.fn<(params: FindOrdersParams) => Promise<PaginatedOrders>>(),
  };

  let useCase: ListOrdersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListOrdersUseCase(
      orderRepository as unknown as OrderRepository,
    );
  });

  it('forwards pagination and optional status to the repository', async () => {
    const page = {
      data: [{ id: '1', status: OrderStatus.RECEIVED }] as Order[],
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    };
    orderRepository.findAll.mockResolvedValue(page);

    const query = {
      page: 2,
      limit: 10,
      status: OrderStatus.RECEIVED,
    };
    const result = await useCase.execute(query);

    expect(result).toBe(page);
    expect(orderRepository.findAll).toHaveBeenCalledWith(query);
  });
});
