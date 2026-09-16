import type {
  Order,
  OrderCustomer,
  OrderItem,
  OrderStatus,
} from './order.entity';

export type CreateOrderData = {
  externalOrderId: string;
  customer: OrderCustomer;
  items: OrderItem[];
  currency: string;
  idempotencyKey: string;
};

export type OrderConversionUpdate = {
  totalAmount: number;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  status: OrderStatus;
};

export type FindOrdersParams = {
  page: number;
  limit: number;
  status?: OrderStatus;
};

export type PaginatedOrders = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export interface OrderRepository {
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
  findByExternalOrderId(externalOrderId: string): Promise<Order | null>;
  findById(id: string): Promise<Order | null>;
  findAll(params: FindOrdersParams): Promise<PaginatedOrders>;
  create(data: CreateOrderData): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
  updateConversion(
    id: string,
    data: OrderConversionUpdate,
  ): Promise<Order | null>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
