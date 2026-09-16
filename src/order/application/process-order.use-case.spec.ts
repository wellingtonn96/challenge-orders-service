import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ProcessOrderUseCase } from './process-order.use-case';
import type {
  ConvertCurrencyInput,
  ConvertCurrencyResult,
  CurrencyConverter,
} from '../../shared/currency/currency-converter.port';
import { OrderStatus } from '../entities/order.entity';
import type { Order } from '../entities/order.entity';
import type {
  OrderConversionUpdate,
  OrderRepository,
} from '../infrastructure/order.repository';

describe('ProcessOrderUseCase', () => {
  const order = {
    id: 'order-1',
    currency: 'USD',
    items: [{ sku: 'ABC123', qty: 2, unit_price: 50 }],
    status: OrderStatus.RECEIVED,
  } as Order;

  const orderRepository = {
    findById: jest.fn<(id: string) => Promise<Order | null>>(),
    updateStatus: jest.fn<
      (id: string, status: OrderStatus) => Promise<Order | null>
    >(),
    updateConversion: jest.fn<
      (id: string, data: OrderConversionUpdate) => Promise<Order | null>
    >(),
  };

  const currencyConverter = {
    convert: jest.fn<
      (input: ConvertCurrencyInput) => Promise<ConvertCurrencyResult>
    >(),
  };

  let useCase: ProcessOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ProcessOrderUseCase(
      orderRepository as unknown as OrderRepository,
      currencyConverter as unknown as CurrencyConverter,
    );
  });

  it('returns early when order does not exist', async () => {
    orderRepository.findById.mockResolvedValue(null);

    await useCase.execute('missing');

    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
    expect(currencyConverter.convert).not.toHaveBeenCalled();
  });

  it('converts total and marks order as completed', async () => {
    orderRepository.findById.mockResolvedValue(order);
    currencyConverter.convert.mockResolvedValue({
      amount: 100,
      from: 'USD',
      to: 'BRL',
      convertedAmount: 500,
      rate: 5,
      date: '2026-09-16',
    });

    await useCase.execute(order.id);

    expect(orderRepository.updateStatus).toHaveBeenCalledWith(
      order.id,
      OrderStatus.PROCESSING,
    );
    expect(currencyConverter.convert).toHaveBeenCalledWith({
      amount: 100,
      from: 'USD',
      to: 'BRL',
    });
    expect(orderRepository.updateConversion).toHaveBeenCalledWith(order.id, {
      totalAmount: 100,
      convertedAmount: 500,
      convertedCurrency: 'BRL',
      exchangeRate: 5,
      status: OrderStatus.COMPLETED,
    });
  });

  it('marks order as failed when conversion throws', async () => {
    orderRepository.findById.mockResolvedValue(order);
    currencyConverter.convert.mockRejectedValue(new Error('FX down'));

    await expect(useCase.execute(order.id)).rejects.toThrow('FX down');

    expect(orderRepository.updateStatus).toHaveBeenCalledWith(
      order.id,
      OrderStatus.FAILED,
    );
    expect(orderRepository.updateConversion).not.toHaveBeenCalled();
  });
});
