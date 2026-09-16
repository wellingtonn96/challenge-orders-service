import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../domain/order.entity';
import type {
  CreateOrderData,
  OrderConversionUpdate,
  OrderRepository,
} from '../../../domain/order-repository.port';
import { OrderOrmEntity } from './order.orm-entity';
import { toDomainOrder } from './order.mapper';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>,
  ) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { idempotencyKey } });
    return entity ? toDomainOrder(entity) : null;
  }

  async findByExternalOrderId(externalOrderId: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { externalOrderId },
    });
    return entity ? toDomainOrder(entity) : null;
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomainOrder(entity) : null;
  }

  async create(data: CreateOrderData): Promise<Order> {
    const entity = this.repository.create({
      externalOrderId: data.externalOrderId,
      customer: data.customer,
      items: data.items,
      currency: data.currency,
      idempotencyKey: data.idempotencyKey,
      status: OrderStatus.RECEIVED,
    });

    const saved = await this.repository.save(entity);
    return toDomainOrder(saved);
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
