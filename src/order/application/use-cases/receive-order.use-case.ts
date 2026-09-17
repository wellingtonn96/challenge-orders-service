import { Inject, Injectable } from '@nestjs/common';
import type { MessageBus } from '../../../shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../../shared/messaging/messaging.constants';
import type { OrderRepository } from '../../domain/order-repository.port';
import { ORDER_REPOSITORY } from '../../domain/order-repository.port';
import type { Order } from '../../domain/order.entity';

import type { CreateOrderData } from '../../domain/order-repository.port';

export type ReceiveOrderCommand = CreateOrderData;
@Injectable()
export class ReceiveOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(MESSAGE_BUS) private readonly messageBus: MessageBus,
  ) {}

  async execute(command: ReceiveOrderCommand): Promise<Order> {
    const existing = await this.orderRepository.findByIdempotencyKey(
      command.idempotencyKey,
    );

    if (existing) {
      return existing;
    }

    const order = await this.orderRepository.create(command);

    await this.messageBus.publish(MessageQueues.ORDERS, {
      orderId: order.id,
    });

    return order;
  }
}
