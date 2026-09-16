import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CurrencyService } from '../shared/currency/currency.service';
import { DEFAULT_TARGET_CURRENCY } from '../shared/currency/currency.constants';
import { RabbitMqQueues } from '../shared/rabbitmq/rabbitmq.constants';
import { RabbitMqService } from '../shared/rabbitmq/rabbitmq.service';
import type { ReceiveOrderDto } from './dto/receive-order.schema';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly rabbitMqService: RabbitMqService,
    private readonly currencyService: CurrencyService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMqService.consume<{ orderId: string }>(
      RabbitMqQueues.ORDERS,
      async (payload) => {
        await this.processOrder(payload.orderId);
      },
    );
  }

  async receiveOrder(body: ReceiveOrderDto): Promise<Order> {
    const existing = await this.orderRepository.findByIdempotencyKey(
      body.idempotency_key,
    );

    if (existing) {
      return existing;
    }

    const order = await this.orderRepository.createFromPayload(body);
    await this.rabbitMqService.publish(RabbitMqQueues.ORDERS, {
      orderId: order.id,
    });
    return order;
  }

  async processOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      this.logger.warn(`Order ${orderId} not found for processing`);
      return;
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.PROCESSING);

    try {
      const totalAmount = order.items.reduce(
        (sum, item) => sum + item.qty * item.unit_price,
        0,
      );

      const conversion = await this.currencyService.convert({
        amount: totalAmount,
        from: order.currency,
        to: DEFAULT_TARGET_CURRENCY,
      });

      await this.orderRepository.updateConversion(orderId, {
        totalAmount,
        convertedAmount: conversion.convertedAmount,
        convertedCurrency: conversion.to,
        exchangeRate: conversion.rate,
        status: OrderStatus.COMPLETED,
      });

      this.logger.log(
        `Order ${orderId} processed: ${totalAmount} ${order.currency} -> ${conversion.convertedAmount} ${conversion.to}`,
      );
    } catch (error) {
      await this.orderRepository.updateStatus(orderId, OrderStatus.FAILED);
      this.logger.error(
        `Failed to process order ${orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
