import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Order } from '../../domain/order.entity';
import type { OrderRepository } from '../../domain/order-repository.port';
import { ORDER_REPOSITORY } from '../../domain/order-repository.port';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }
}
