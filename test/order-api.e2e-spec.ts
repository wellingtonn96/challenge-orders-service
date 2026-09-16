import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { GetOrderUseCase } from '../src/order/application/use-cases/get-order.use-case';
import { GetQueueMetricsUseCase } from '../src/order/application/use-cases/get-queue-metrics.use-case';
import { ListOrdersUseCase } from '../src/order/application/use-cases/list-orders.use-case';
import { OrderController } from '../src/order/presentation/controller/order.controller';
import { OrderStatus } from '../src/order/domain/order.entity';
import type { Order } from '../src/order/domain/order.entity';
import type {
  FindOrdersParams,
  PaginatedOrders,
} from '../src/order/domain/order-repository.port';
import { ORDER_REPOSITORY } from '../src/order/domain/order-repository.port';
import type { QueueMetrics } from '../src/shared/messaging/message-bus.port';
import { MESSAGE_BUS } from '../src/shared/messaging/message-bus.port';
import { MessageQueues } from '../src/shared/messaging/messaging.constants';

describe('Order API (e2e)', () => {
  let app: INestApplication<App>;

  const orderRepository = {
    findAll: jest.fn<(params: FindOrdersParams) => Promise<PaginatedOrders>>(),
    findById: jest.fn<(id: string) => Promise<Order | null>>(),
  };

  const messageBus = {
    getQueueMetrics: jest.fn<(queue: string) => Promise<QueueMetrics>>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        ListOrdersUseCase,
        GetOrderUseCase,
        GetQueueMetricsUseCase,
        { provide: ORDER_REPOSITORY, useValue: orderRepository },
        { provide: MESSAGE_BUS, useValue: messageBus },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /orders returns a paginated order list with defaults', async () => {
    const page: PaginatedOrders = {
      data: [
        { id: '1', status: OrderStatus.RECEIVED },
        { id: '2', status: OrderStatus.COMPLETED },
      ] as Order[],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    orderRepository.findAll.mockResolvedValue(page);

    const response = await request(app.getHttpServer())
      .get('/orders')
      .expect(200);

    expect(response.body).toEqual(page);
    expect(orderRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it('GET /orders forwards page, limit and status', async () => {
    const page: PaginatedOrders = {
      data: [{ id: '1', status: OrderStatus.COMPLETED }] as Order[],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    };
    orderRepository.findAll.mockResolvedValue(page);

    const response = await request(app.getHttpServer())
      .get('/orders')
      .query({ page: 2, limit: 5, status: OrderStatus.COMPLETED })
      .expect(200);

    expect(response.body).toEqual(page);
    expect(orderRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      status: OrderStatus.COMPLETED,
    });
  });

  it('GET /orders returns 400 for invalid status', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .query({ status: 'unknown' })
      .expect(400);

    expect(orderRepository.findAll).not.toHaveBeenCalled();
  });

  it('GET /orders/metrics/queues returns queue metrics', async () => {
    const metrics: QueueMetrics = {
      queue: MessageQueues.ORDERS,
      messageCount: 2,
      consumerCount: 1,
    };
    messageBus.getQueueMetrics.mockResolvedValue(metrics);

    const response = await request(app.getHttpServer())
      .get('/orders/metrics/queues')
      .expect(200);

    expect(response.body).toEqual(metrics);
    expect(messageBus.getQueueMetrics).toHaveBeenCalledWith(
      MessageQueues.ORDERS,
    );
  });

  it('GET /orders/:id returns the order', async () => {
    const order = { id: 'order-1', status: OrderStatus.COMPLETED } as Order;
    orderRepository.findById.mockResolvedValue(order);

    const response = await request(app.getHttpServer())
      .get('/orders/order-1')
      .expect(200);

    expect(response.body.id).toBe('order-1');
  });

  it('GET /orders/:id returns 404 when missing', async () => {
    orderRepository.findById.mockResolvedValue(null);

    await request(app.getHttpServer()).get('/orders/missing').expect(404);
  });
});
