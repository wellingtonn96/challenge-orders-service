import { Global, Module } from '@nestjs/common';
import { MESSAGE_BUS } from './message-bus.port';
import { RabbitMqMessageBus } from './rabbitmq.message-bus';

@Global()
@Module({
  providers: [
    RabbitMqMessageBus,
    {
      provide: MESSAGE_BUS,
      useExisting: RabbitMqMessageBus,
    },
  ],
  exports: [MESSAGE_BUS, RabbitMqMessageBus],
})
export class MessagingModule {}
