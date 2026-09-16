import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessOrderUseCase } from './application/use-cases/process-order.use-case';
import { ReceiveOrderUseCase } from './application/use-cases/receive-order.use-case';
import { ORDER_REPOSITORY } from './domain/order-repository.port';
import { OrderConsumer } from './infrastructure/order.consumer';
import { OrderOrmEntity } from './infrastructure/database/typeorm/order.orm-entity';
import { TypeOrmOrderRepository } from './infrastructure/database/typeorm/typeorm-order.repository';
import { OrderWebhookController } from './presentation/controller/order-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderOrmEntity])],
  controllers: [OrderWebhookController],
  providers: [
    TypeOrmOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useExisting: TypeOrmOrderRepository,
    },
    ReceiveOrderUseCase,
    ProcessOrderUseCase,
    OrderConsumer,
  ],
  exports: [ReceiveOrderUseCase, ProcessOrderUseCase, ORDER_REPOSITORY],
})
export class OrderModule {}
