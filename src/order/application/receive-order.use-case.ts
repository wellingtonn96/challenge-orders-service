import { Inject, Injectable } from '@nestjs/common';
import type { MessageBus } from '../../shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../shared/messaging/messaging.constants';
import type { ReceiveOrderDto } from '../dto/receive-order.schema';
import type { Order } from '../entities/order.entity';
import { OrderRepository } from '../infrastructure/order.repository';

@Injectable()
export class ReceiveOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    @Inject(MESSAGE_BUS) private readonly messageBus: MessageBus,
  ) {}

  async execute(body: ReceiveOrderDto): Promise<Order> {
    const existing = await this.orderRepository.findByIdempotencyKey(
      body.idempotency_key,
    );

    if (existing) {
      return existing;
    }

    const order = await this.orderRepository.createFromPayload(body);
    await this.messageBus.publish(MessageQueues.ORDERS, {
      orderId: order.id,
    });
    return order;
  }
}
