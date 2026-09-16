import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
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

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'external_order_id', type: 'varchar', length: 255 })
  externalOrderId: string;

  @Column({ name: 'customer', type: 'jsonb' })
  customer: OrderCustomer;

  @Column({ name: 'items', type: 'jsonb' })
  items: OrderItem[];

  @Column({ name: 'currency', type: 'varchar', length: 3 })
  currency: string;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  totalAmount: string | null;

  @Column({
    name: 'converted_amount',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  convertedAmount: string | null;

  @Column({
    name: 'converted_currency',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  convertedCurrency: string | null;

  @Column({
    name: 'exchange_rate',
    type: 'numeric',
    precision: 18,
    scale: 8,
    nullable: true,
  })
  exchangeRate: string | null;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255 })
  idempotencyKey: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
