import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessOrderUseCase } from './application/process-order.use-case';
import { ReceiveOrderUseCase } from './application/receive-order.use-case';
import { Order } from './entities/order.entity';
import { OrderConsumer } from './infrastructure/order.consumer';
import { OrderRepository } from './infrastructure/order.repository';
import { OrderWebhookController } from './order-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderWebhookController],
  providers: [
    OrderRepository,
    ReceiveOrderUseCase,
    ProcessOrderUseCase,
    OrderConsumer,
  ],
  exports: [ReceiveOrderUseCase, ProcessOrderUseCase, OrderRepository],
})
export class OrderModule {}
