import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { MessageBus } from '../../shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../shared/messaging/messaging.constants';
import { ProcessOrderUseCase } from '../application/use-cases/process-order.use-case';

@Injectable()
export class OrderConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    @Inject(MESSAGE_BUS) private readonly messageBus: MessageBus,
    private readonly processOrderUseCase: ProcessOrderUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messageBus.consume<{ orderId: string }>(
      MessageQueues.ORDERS,
      async (payload) => {
        await this.processOrderUseCase.execute(payload.orderId);
      },
    );
    this.logger.log(`Subscribed to queue "${MessageQueues.ORDERS}"`);
  }
}
