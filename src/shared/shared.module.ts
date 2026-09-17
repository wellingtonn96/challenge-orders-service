import { Global, Module } from '@nestjs/common';
import { CurrencyModule } from './currency/currency.module';
import { HttpModule } from './http/http.module';
import { MessagingModule } from './messaging/messaging.module';
@Global()
@Module({
  imports: [HttpModule, MessagingModule, CurrencyModule],
  exports: [HttpModule, MessagingModule, CurrencyModule],
})
export class SharedModule {}
