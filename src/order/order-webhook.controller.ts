import { Controller, Post, Body } from '@nestjs/common';
import { JoiValidationPipe } from '../shared/pipes/joi-validation.pipe';
import { receiveOrderSchema } from './dto/receive-order.schema';
import type { ReceiveOrderDto } from './dto/receive-order.schema';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

@Controller('webhook')
export class OrderWebhookController {
  constructor(private readonly orderService: OrderService) {}

  @Post('orders')
  receiveOrder(
    @Body(new JoiValidationPipe(receiveOrderSchema)) body: ReceiveOrderDto,
  ): Promise<Order> {
    return this.orderService.receiveOrder(body);
  }
}
