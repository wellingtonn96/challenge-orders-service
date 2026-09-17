export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  FAILED_ENRICHMENT = 'FAILED_ENRICHMENT',
}

export type OrderCustomer = {
  email: string;
  name: string;
};

export type OrderItem = {
  sku: string;
  qty: number;
  unit_price: number;
};

export class Order {
  id: string;
  externalOrderId: string;
  customer: OrderCustomer;
  items: OrderItem[];
  currency: string;
  totalAmount: number | null;
  convertedAmount: number | null;
  convertedCurrency: string | null;
  exchangeRate: number | null;
  idempotencyKey: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    externalOrderId: string;
    customer: OrderCustomer;
    items: OrderItem[];
    currency: string;
    totalAmount: number | null;
    convertedAmount: number | null;
    convertedCurrency: string | null;
    exchangeRate: number | null;
    idempotencyKey: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.externalOrderId = props.externalOrderId;
    this.customer = props.customer;
    this.items = props.items;
    this.currency = props.currency;
    this.totalAmount = props.totalAmount;
    this.convertedAmount = props.convertedAmount;
    this.convertedCurrency = props.convertedCurrency;
    this.exchangeRate = props.exchangeRate;
    this.idempotencyKey = props.idempotencyKey;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
