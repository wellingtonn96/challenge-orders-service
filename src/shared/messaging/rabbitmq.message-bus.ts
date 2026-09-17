import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
  type Options,
} from 'amqplib';
import type { MessageBus, MessageHandler, QueueMetrics } from './message-bus.port';
import {
  MessageExchanges,
  MessageQueues,
  RABBITMQ_URL,
} from './messaging.constants';

@Injectable()
export class RabbitMqMessageBus
  implements MessageBus, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqMessageBus.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly assertedQueues = new Set<string>();

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    this.logger.log('Connected to RabbitMQ');
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publish(queue: string, message: unknown): Promise<boolean> {
    await this.assertQueue(queue);

    return this.getChannel().sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );
  }

  async consume<T = unknown>(
    queue: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    await this.assertQueue(queue);
    const channel = this.getChannel();

    await channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      try {
        const payload = JSON.parse(msg.content.toString()) as T;
        await handler(payload);
        channel.ack(msg);
      } catch (error) {
        this.logger.error(
          `Failed to process message from queue "${queue}"; sending to DLQ (nack without requeue)`,
          error instanceof Error ? error.stack : undefined,
        );
        channel.nack(msg, false, false);
      }
    });

    this.logger.log(`Consuming queue "${queue}"`);
  }

  async getQueueMetrics(queue: string): Promise<QueueMetrics> {
    await this.assertQueue(queue);
    const info = await this.getChannel().checkQueue(queue);

    return {
      queue: info.queue,
      messageCount: info.messageCount,
      consumerCount: info.consumerCount,
    };
  }

  private async assertQueue(
    queue: string,
    options: Options.AssertQueue = { durable: true },
  ): Promise<void> {
    if (this.assertedQueues.has(queue)) {
      return;
    }

    if (queue === MessageQueues.ORDERS) {
      await this.assertOrdersQueueWithDlq();
      return;
    }

    await this.getChannel().assertQueue(queue, options);
    this.assertedQueues.add(queue);
    this.logger.log(`Queue "${queue}" asserted`);
  }

  private async assertOrdersQueueWithDlq(): Promise<void> {
    const channel = this.getChannel();
    const mainQueue = MessageQueues.ORDERS;
    const dlq = MessageQueues.ORDERS_DLQ;
    const dlx = MessageExchanges.ORDERS_DLX;

    await channel.assertExchange(dlx, 'direct', { durable: true });
    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, dlx, dlq);

    await channel.assertQueue(mainQueue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlx,
        'x-dead-letter-routing-key': dlq,
      },
    });

    this.assertedQueues.add(dlq);
    this.assertedQueues.add(mainQueue);
    this.logger.log(
      `Queue "${mainQueue}" asserted with DLX "${dlx}" -> DLQ "${dlq}"`,
    );
  }

  private getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }
    return this.channel;
  }
}
