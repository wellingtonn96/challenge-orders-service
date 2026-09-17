import { Controller, Get } from '@nestjs/common';
import { GetQueueMetricsUseCase } from '../../application/use-cases/get-queue-metrics.use-case';
import type { OrdersQueueMetrics } from '../../application/use-cases/get-queue-metrics.use-case';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly getQueueMetricsUseCase: GetQueueMetricsUseCase,
  ) {}

  @Get('metrics')
  getQueueMetrics(): Promise<OrdersQueueMetrics> {
    return this.getQueueMetricsUseCase.execute();
  }
}
