import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AxiosInstance } from 'axios';
import { AXIOS_INSTANCE } from '../http/http.constants';
import { isTransientHttpError } from '../resilience/is-transient-http-error';
import { withBackoff } from '../resilience/with-backoff';
import {
  CURRENCY_API_BASE_URL,
  DEFAULT_TARGET_CURRENCY,
  FX_RETRY_ATTEMPTS,
  FX_RETRY_BASE_MS,
  FX_RETRY_MAX_MS,
} from './currency.constants';
import type {
  ConvertCurrencyInput,
  ConvertCurrencyResult,
  CurrencyConverter,
} from './currency-converter.port';

type FrankfurterRateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

@Injectable()
export class FrankfurterCurrencyAdapter implements CurrencyConverter {
  private readonly logger = new Logger(FrankfurterCurrencyAdapter.name);

  constructor(
    @Inject(AXIOS_INSTANCE) private readonly http: AxiosInstance,
  ) {}

  async convert(input: ConvertCurrencyInput): Promise<ConvertCurrencyResult> {
    const from = input.from.toUpperCase();
    const to = (input.to ?? DEFAULT_TARGET_CURRENCY).toUpperCase();
    const amount = input.amount;

    if (amount < 0) {
      throw new Error('Amount must be greater than or equal to zero');
    }

    if (from === to) {
      return {
        amount,
        from,
        to,
        convertedAmount: amount,
        rate: 1,
        date: new Date().toISOString().slice(0, 10),
      };
    }

    const url = `${CURRENCY_API_BASE_URL}/v2/rate/${from}/${to}`;

    this.logger.log(`HTTP GET ${url}`);

    const { data } = await withBackoff(
      () => this.http.get<FrankfurterRateResponse>(url),
      {
        retries: FX_RETRY_ATTEMPTS,
        baseMs: FX_RETRY_BASE_MS,
        maxMs: FX_RETRY_MAX_MS,
        shouldRetry: isTransientHttpError,
        onRetry: (error, attempt, delayMs) => {
          this.logger.warn(
            `FX request failed (attempt ${attempt}/${FX_RETRY_ATTEMPTS}); retrying in ${delayMs}ms`,
            error instanceof Error ? error.message : undefined,
          );
        },
      },
    );

    if (typeof data.rate !== 'number') {
      throw new Error(`Exchange rate not available for ${from} -> ${to}`);
    }

    const convertedAmount = Number((amount * data.rate).toFixed(4));

    this.logger.log(
      `HTTP FX ${amount} ${from} -> ${convertedAmount} ${to} (rate=${data.rate}, date=${data.date})`,
    );

    return {
      amount,
      from,
      to,
      convertedAmount,
      rate: data.rate,
      date: data.date,
    };
  }
}
