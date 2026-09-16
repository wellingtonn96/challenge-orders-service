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
import { ReceiveOrderUseCase } from '../src/order/application/use-cases/receive-order.use-case';
import { ProcessOrderUseCase } from '../src/order/application/use-cases/process-order.use-case';
import { OrderWebhookController } from '../src/order/presentation/controller/order-webhook.controller';
import { OrderStatus } from '../src/order/domain/order.entity';
import type { Order } from '../src/order/domain/order.entity';
import type {
  CreateOrderData,
  OrderConversionUpdate,
} from '../src/order/domain/order-repository.port';
import { ORDER_REPOSITORY } from '../src/order/domain/order-repository.port';
import { MESSAGE_BUS } from '../src/shared/messaging/message-bus.port';
import { MessageQueues } from '../src/shared/messaging/messaging.constants';
import type {
  ConvertCurrencyInput,
  ConvertCurrencyResult,
} from '../src/shared/currency/currency-converter.port';
import { CURRENCY_CONVERTER } from '../src/shared/currency/currency-converter.port';

describe('Order webhook (e2e)', () => {
  let app: INestApplication<App>;

  const orderRepository = {
    findByIdempotencyKey: jest.fn<(key: string) => Promise<Order | null>>(),
    create: jest.fn<(data: CreateOrderData) => Promise<Order>>(),
    findById: jest.fn<(id: string) => Promise<Order | null>>(),
    updateStatus: jest.fn<
      (id: string, status: OrderStatus) => Promise<Order | null>
    >(),
    updateConversion: jest.fn<
      (id: string, data: OrderConversionUpdate) => Promise<Order | null>
    >(),
  };

  const messageBus = {
    publish: jest.fn<(queue: string, message: unknown) => Promise<boolean>>(),
    consume: jest.fn<(queue: string, handler: unknown) => Promise<void>>(),
  };

  const currencyConverter = {
    convert: jest.fn<
      (input: ConvertCurrencyInput) => Promise<ConvertCurrencyResult>
    >(),
  };

  const validPayload = {
    order_id: 'ext-123',
    customer: { email: 'user@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
    idempotency_key: 'idem-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    messageBus.publish.mockResolvedValue(true);
    messageBus.consume.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderWebhookController],
      providers: [
        ReceiveOrderUseCase,
        ProcessOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: orderRepository },
        { provide: MESSAGE_BUS, useValue: messageBus },
        { provide: CURRENCY_CONVERTER, useValue: currencyConverter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /webhook/orders accepts valid payload and publishes to queue', async () => {
    const created = {
      id: 'order-uuid',
      status: OrderStatus.RECEIVED,
      idempotencyKey: validPayload.idempotency_key,
    } as Order;

    orderRepository.findByIdempotencyKey.mockResolvedValue(null);
    orderRepository.create.mockResolvedValue(created);

    const response = await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(validPayload)
      .expect(201);

    expect(response.body.id).toBe('order-uuid');
    expect(orderRepository.create).toHaveBeenCalledWith({
      externalOrderId: validPayload.order_id,
      customer: validPayload.customer,
      items: validPayload.items,
      currency: validPayload.currency,
      idempotencyKey: validPayload.idempotency_key,
    });
    expect(messageBus.publish).toHaveBeenCalledWith(MessageQueues.ORDERS, {
      orderId: 'order-uuid',
    });
  });

  it('POST /webhook/orders returns 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/webhook/orders')
      .send({ ...validPayload, customer: { email: 'bad', name: 'Ana' } })
      .expect(400);

    expect(orderRepository.create).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('POST /webhook/orders is idempotent for the same key', async () => {
    const existing = {
      id: 'existing-id',
      status: OrderStatus.COMPLETED,
      idempotencyKey: validPayload.idempotency_key,
    } as Order;

    orderRepository.findByIdempotencyKey.mockResolvedValue(existing);

    const first = await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(validPayload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(validPayload)
      .expect(201);

    expect(first.body.id).toBe('existing-id');
    expect(second.body.id).toBe('existing-id');
    expect(orderRepository.create).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('ProcessOrderUseCase integrates conversion and persistence', async () => {
    const processOrder = app.get(ProcessOrderUseCase);
    const order = {
      id: 'order-uuid',
      currency: 'USD',
      items: [{ sku: 'ABC123', qty: 2, unit_price: 50 }],
      status: OrderStatus.RECEIVED,
    } as Order;

    orderRepository.findById.mockResolvedValue(order);
    currencyConverter.convert.mockResolvedValue({
      amount: 100,
      from: 'USD',
      to: 'BRL',
      convertedAmount: 520,
      rate: 5.2,
      date: '2026-09-16',
    });

    await processOrder.execute(order.id);

    expect(currencyConverter.convert).toHaveBeenCalledWith({
      amount: 100,
      from: 'USD',
      to: 'BRL',
    });
    expect(orderRepository.updateConversion).toHaveBeenCalledWith(order.id, {
      totalAmount: 100,
      convertedAmount: 520,
      convertedCurrency: 'BRL',
      exchangeRate: 5.2,
      status: OrderStatus.COMPLETED,
    });
  });
});
