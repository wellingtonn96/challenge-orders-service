import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import type { ReceiveOrderDto } from './dto/receive-order.schema';

export type OrderConversionUpdate = {
  totalAmount: number;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  status: OrderStatus;
};

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    return this.repository.findOne({ where: { idempotencyKey } });
  }

  findByExternalOrderId(externalOrderId: string): Promise<Order | null> {
    return this.repository.findOne({ where: { externalOrderId } });
  }

  findById(id: string): Promise<Order | null> {
    return this.repository.findOne({ where: { id } });
  }

  createFromPayload(payload: ReceiveOrderDto): Promise<Order> {
    const order = this.repository.create({
      externalOrderId: payload.order_id,
      customer: payload.customer,
      items: payload.items,
      currency: payload.currency,
      idempotencyKey: payload.idempotency_key,
      status: OrderStatus.RECEIVED,
    });

    return this.repository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await this.repository.update({ id }, { status });
    return this.findById(id);
  }

  async updateConversion(
    id: string,
    data: OrderConversionUpdate,
  ): Promise<Order | null> {
    await this.repository.update(
      { id },
      {
        totalAmount: data.totalAmount.toFixed(4),
        convertedAmount: data.convertedAmount.toFixed(4),
        convertedCurrency: data.convertedCurrency,
        exchangeRate: data.exchangeRate.toFixed(8),
        status: data.status,
      },
    );
    return this.findById(id);
  }
}
