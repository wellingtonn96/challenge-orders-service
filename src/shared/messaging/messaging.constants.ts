export const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  `amqp://${process.env.RABBITMQ_USER ?? 'orders'}:${process.env.RABBITMQ_PASSWORD ?? 'orders'}@${process.env.RABBITMQ_HOST ?? 'localhost'}:${process.env.RABBITMQ_PORT ?? '5672'}`;

export const MessageQueues = {
  ORDERS: process.env.RABBITMQ_ORDERS_QUEUE ?? 'orders',
  ORDERS_DLQ: process.env.RABBITMQ_ORDERS_DLQ ?? 'orders.dlq',
} as const;

export const MessageExchanges = {
  ORDERS_DLX: process.env.RABBITMQ_ORDERS_DLX ?? 'orders.dlx',
} as const;
