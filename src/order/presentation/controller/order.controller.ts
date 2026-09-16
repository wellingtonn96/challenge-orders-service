import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { GetQueueMetricsUseCase } from '../../application/use-cases/get-queue-metrics.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import type { Order } from '../../domain/order.entity';
import type { PaginatedOrders } from '../../domain/order-repository.port';
import type { OrdersQueueMetrics } from '../../application/use-cases/get-queue-metrics.use-case';
import { JoiValidationPipe } from '../../../shared/pipes/joi-validation.pipe';
import {
  listOrdersQuerySchema,
  type ListOrdersHttpQuery,
} from '../dto/list-orders.http-dto';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly getQueueMetricsUseCase: GetQueueMetricsUseCase,
  ) {}

  @Get()
  listOrders(
    @Query(new JoiValidationPipe(listOrdersQuerySchema))
    query: ListOrdersHttpQuery,
  ): Promise<PaginatedOrders> {
    return this.listOrdersUseCase.execute(query);
  }

  @Get('metrics/queues')
  getQueueMetrics(): Promise<OrdersQueueMetrics> {
    return this.getQueueMetricsUseCase.execute();
  }

  @Get(':id')
  getOrder(@Param('id') id: string): Promise<Order> {
    return this.getOrderUseCase.execute(id);
  }
}
