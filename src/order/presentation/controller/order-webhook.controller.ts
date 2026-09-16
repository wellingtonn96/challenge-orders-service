import { Controller, Post, Body } from '@nestjs/common';
import { JoiValidationPipe } from '../../../shared/pipes/joi-validation.pipe';
import { ReceiveOrderUseCase } from '../../application/use-cases/receive-order.use-case';
import { Order } from '../../domain/order.entity';
import {
  receiveOrderSchema,
  type ReceiveOrderHttpDto,
} from '../dto/receive-order.http-dto';

@Controller('webhook')
export class OrderWebhookController {
  constructor(private readonly receiveOrderUseCase: ReceiveOrderUseCase) {}

  @Post('orders')
  receiveOrder(
    @Body(new JoiValidationPipe(receiveOrderSchema)) body: ReceiveOrderHttpDto,
  ): Promise<Order> {
    return this.receiveOrderUseCase.execute({
      externalOrderId: body.order_id,
      customer: body.customer,
      items: body.items,
      currency: body.currency,
      idempotencyKey: body.idempotency_key,
    });
  }
}
