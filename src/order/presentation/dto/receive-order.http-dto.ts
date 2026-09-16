import * as Joi from 'joi';

export const receiveOrderSchema = Joi.object({
  order_id: Joi.string().required(),
  customer: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(1).required(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required(),
        qty: Joi.number().integer().min(1).required(),
        unit_price: Joi.number().positive().required(),
      }),
    )
    .min(1)
    .required(),
  currency: Joi.string().length(3).uppercase().required(),
  idempotency_key: Joi.string().uuid().required(),
});

export type ReceiveOrderHttpDto = {
  order_id: string;
  customer: {
    email: string;
    name: string;
  };
  items: {
    sku: string;
    qty: number;
    unit_price: number;
  }[];
  currency: string;
  idempotency_key: string;
};
