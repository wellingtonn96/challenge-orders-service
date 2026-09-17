import { Inject, Injectable, Logger } from '@nestjs/common';
import type { CurrencyConverter } from '../../../shared/currency/currency-converter.port';
import { CURRENCY_CONVERTER } from '../../../shared/currency/currency-converter.port';
import { DEFAULT_TARGET_CURRENCY } from '../../../shared/currency/currency.constants';
import { calculateOrderTotal } from '../../domain/calculate-total';
import type { OrderRepository } from '../../domain/order-repository.port';
import { ORDER_REPOSITORY } from '../../domain/order-repository.port';
import { OrderStatus } from '../../domain/order.entity';

@Injectable()
export class ProcessOrderUseCase {
  private readonly logger = new Logger(ProcessOrderUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverter,
  ) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      this.logger.warn(`Order ${orderId} not found for processing`);
      return;
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.PROCESSING);

    try {
      const totalAmount = calculateOrderTotal(order.items);

      const conversion = await this.currencyConverter.convert({
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
      await this.orderRepository.updateStatus(
        orderId,
        OrderStatus.FAILED_ENRICHMENT,
      );
      this.logger.error(
        `Failed to process order ${orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
