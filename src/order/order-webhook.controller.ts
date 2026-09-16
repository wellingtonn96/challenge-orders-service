import { Controller, Post, Body } from '@nestjs/common';
import { JoiValidationPipe } from '../shared/pipes/joi-validation.pipe';
import { ReceiveOrderUseCase } from './application/receive-order.use-case';
import { receiveOrderSchema } from './dto/receive-order.schema';
import type { ReceiveOrderDto } from './dto/receive-order.schema';
import { Order } from './entities/order.entity';

@Controller('webhook')
export class OrderWebhookController {
  constructor(private readonly receiveOrderUseCase: ReceiveOrderUseCase) {}

  @Post('orders')
  receiveOrder(
    @Body(new JoiValidationPipe(receiveOrderSchema)) body: ReceiveOrderDto,
  ): Promise<Order> {
    return this.receiveOrderUseCase.execute(body);
  }
}
