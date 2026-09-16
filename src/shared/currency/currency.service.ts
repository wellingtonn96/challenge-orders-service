import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AxiosInstance } from 'axios';
import { AXIOS_INSTANCE } from '../http/http.constants';
import {
  CURRENCY_API_BASE_URL,
  DEFAULT_TARGET_CURRENCY,
} from './currency.constants';

export type ConvertCurrencyInput = {
  amount: number;
  from: string;
  to?: string;
};

export type ConvertCurrencyResult = {
  amount: number;
  from: string;
  to: string;
  convertedAmount: number;
  rate: number;
  date: string;
};

/** Resposta HTTP da Frankfurter API v2. */
type FrankfurterRateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @Inject(AXIOS_INSTANCE) private readonly http: AxiosInstance,
  ) {}

  /**
   * Converte um valor via HTTP para a API externa Frankfurter.
   * GET {CURRENCY_API_BASE_URL}/v2/rate/{from}/{to}
   */
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

    const { data } = await this.http.get<FrankfurterRateResponse>(url);

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
