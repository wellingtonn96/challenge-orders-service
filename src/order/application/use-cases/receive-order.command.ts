import type { CreateOrderData } from '../../domain/order-repository.port';

/** Entrada do caso de uso — independente do contrato HTTP. */
export type ReceiveOrderCommand = CreateOrderData;
