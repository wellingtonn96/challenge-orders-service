export type MessageHandler<T = unknown> = (payload: T) => Promise<void> | void;

export interface MessageBus {
  publish(queue: string, message: unknown): Promise<boolean>;
  consume<T = unknown>(
    queue: string,
    handler: MessageHandler<T>,
  ): Promise<void>;
}

export const MESSAGE_BUS = Symbol('MESSAGE_BUS');
