import * as Joi from 'joi';
import { OrderStatus } from '../../domain/order.entity';

export const listOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional(),
});

export type ListOrdersHttpQuery = {
  page: number;
  limit: number;
  status?: OrderStatus;
};
