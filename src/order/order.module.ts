import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { GetQueueMetricsUseCase } from './application/use-cases/get-queue-metrics.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { ProcessOrderUseCase } from './application/use-cases/process-order.use-case';
import { ReceiveOrderUseCase } from './application/use-cases/receive-order.use-case';
import { ORDER_REPOSITORY } from './domain/order-repository.port';
import { OrderConsumer } from './infrastructure/order.consumer';
import { OrderOrmEntity } from './infrastructure/database/typeorm/order.orm-entity';
import { TypeOrmOrderRepository } from './infrastructure/database/typeorm/typeorm-order.repository';
import { OrderController } from './presentation/controller/order.controller';
import { OrderWebhookController } from './presentation/controller/order-webhook.controller';
import { QueueController } from './presentation/controller/queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderOrmEntity])],
  controllers: [OrderWebhookController, OrderController, QueueController],
  providers: [
    TypeOrmOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useExisting: TypeOrmOrderRepository,
    },
    ReceiveOrderUseCase,
    ProcessOrderUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    GetQueueMetricsUseCase,
    OrderConsumer,
  ],
  exports: [
    ReceiveOrderUseCase,
    ProcessOrderUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    GetQueueMetricsUseCase,
    ORDER_REPOSITORY,
  ],
})
export class OrderModule {}
