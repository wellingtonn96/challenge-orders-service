import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetQueueMetricsUseCase } from './get-queue-metrics.use-case';
import type {
  MessageBus,
  QueueMetrics,
} from '../../../shared/messaging/message-bus.port';
import { MessageQueues } from '../../../shared/messaging/messaging.constants';

describe('GetQueueMetricsUseCase', () => {
  const messageBus = {
    getQueueMetrics: jest.fn<(queue: string) => Promise<QueueMetrics>>(),
  };

  let useCase: GetQueueMetricsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetQueueMetricsUseCase(
      messageBus as unknown as MessageBus,
    );
  });

  it('returns metrics for the orders queue', async () => {
    const metrics: QueueMetrics = {
      queue: MessageQueues.ORDERS,
      messageCount: 3,
      consumerCount: 1,
    };
    messageBus.getQueueMetrics.mockResolvedValue(metrics);

    const result = await useCase.execute();

    expect(result).toEqual(metrics);
    expect(messageBus.getQueueMetrics).toHaveBeenCalledWith(
      MessageQueues.ORDERS,
    );
  });
});
