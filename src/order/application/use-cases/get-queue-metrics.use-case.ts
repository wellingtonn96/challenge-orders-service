import { Inject, Injectable } from '@nestjs/common';
import type {
  MessageBus,
  QueueMetrics,
} from '../../../shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../../shared/messaging/messaging.constants';

export type OrdersQueueMetrics = QueueMetrics & {
  deadLetter: QueueMetrics;
};

@Injectable()
export class GetQueueMetricsUseCase {
  constructor(
    @Inject(MESSAGE_BUS) private readonly messageBus: MessageBus,
  ) {}

  async execute(): Promise<OrdersQueueMetrics> {
    const [main, deadLetter] = await Promise.all([
      this.messageBus.getQueueMetrics(MessageQueues.ORDERS),
      this.messageBus.getQueueMetrics(MessageQueues.ORDERS_DLQ),
    ]);

    return {
      ...main,
      deadLetter,
    };
  }
}
