import { Global, Module } from '@nestjs/common';
import { HttpModule } from '../http/http.module';
import { CURRENCY_CONVERTER } from './currency-converter.port';
import { FrankfurterCurrencyAdapter } from './frankfurter-currency.adapter';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    FrankfurterCurrencyAdapter,
    {
      provide: CURRENCY_CONVERTER,
      useExisting: FrankfurterCurrencyAdapter,
    },
  ],
  exports: [CURRENCY_CONVERTER, FrankfurterCurrencyAdapter],
})
export class CurrencyModule {}
