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
import { RABBITMQ_URL } from './rabbitmq.constants';

export type MessageHandler<T = unknown> = (payload: T) => Promise<void> | void;

export type PublishOptions = Options.Publish & {
  persistent?: boolean;
};

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
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

  async assertQueue(
    queue: string,
    options: Options.AssertQueue = { durable: true },
  ): Promise<void> {
    if (this.assertedQueues.has(queue)) {
      return;
    }

    await this.getChannel().assertQueue(queue, options);
    this.assertedQueues.add(queue);
    this.logger.log(`Queue "${queue}" asserted`);
  }

  async publish(
    queue: string,
    message: unknown,
    options: PublishOptions = {},
  ): Promise<boolean> {
    await this.assertQueue(queue);

    const { persistent = true, ...publishOptions } = options;

    return this.getChannel().sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent,
        contentType: 'application/json',
        ...publishOptions,
      },
    );
  }

  async consume<T = unknown>(
    queue: string,
    handler: MessageHandler<T>,
    options: Options.AssertQueue = { durable: true },
  ): Promise<void> {
    await this.assertQueue(queue, options);
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
          `Failed to process message from queue "${queue}"`,
          error instanceof Error ? error.stack : undefined,
        );
        channel.nack(msg, false, false);
      }
    });

    this.logger.log(`Consuming queue "${queue}"`);
  }

  private getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }
    return this.channel;
  }
}
