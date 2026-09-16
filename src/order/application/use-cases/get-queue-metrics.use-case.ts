import { Inject, Injectable } from '@nestjs/common';
import type {
  MessageBus,
  QueueMetrics,
} from '../../../shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../../shared/messaging/messaging.constants';

export type OrdersQueueMetrics = QueueMetrics;

@Injectable()
export class GetQueueMetricsUseCase {
  constructor(
    @Inject(MESSAGE_BUS) private readonly messageBus: MessageBus,
  ) {}

  execute(): Promise<OrdersQueueMetrics> {
    return this.messageBus.getQueueMetrics(MessageQueues.ORDERS);
  }
}
