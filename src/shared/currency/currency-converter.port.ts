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

export interface CurrencyConverter {
  convert(input: ConvertCurrencyInput): Promise<ConvertCurrencyResult>;
}

export const CURRENCY_CONVERTER = Symbol('CURRENCY_CONVERTER');
