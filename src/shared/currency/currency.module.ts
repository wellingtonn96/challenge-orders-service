import { Global, Module } from '@nestjs/common';
import { HttpModule } from '../http/http.module';
import { CurrencyService } from './currency.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
