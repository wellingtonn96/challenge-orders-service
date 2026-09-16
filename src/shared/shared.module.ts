import { Global, Module } from '@nestjs/common';
import { CurrencyModule } from './currency/currency.module';
import { HttpModule } from './http/http.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

/**
 * Infra compartilhada da aplicação.
 * Importar uma vez no AppModule — providers ficam disponíveis
 * em qualquer módulo via injeção de dependência.
 */
@Global()
@Module({
  imports: [HttpModule, RabbitMqModule, CurrencyModule],
  exports: [HttpModule, RabbitMqModule, CurrencyModule],
})
export class SharedModule {}
