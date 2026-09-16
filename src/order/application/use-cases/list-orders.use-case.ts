import { Inject, Injectable } from '@nestjs/common';
import type { OrderStatus } from '../../domain/order.entity';
import type {
  OrderRepository,
  PaginatedOrders,
} from '../../domain/order-repository.port';
import { ORDER_REPOSITORY } from '../../domain/order-repository.port';

export type ListOrdersQuery = {
  page: number;
  limit: number;
  status?: OrderStatus;
};

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  execute(query: ListOrdersQuery): Promise<PaginatedOrders> {
    return this.orderRepository.findAll(query);
  }
}
