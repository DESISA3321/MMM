import { CurrencyCode, CurrencyConfig } from '../types';
export type { CurrencyCode, CurrencyConfig };

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 1.08 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 1.28 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 0.0068 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 0.74 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 0.66 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 0.012 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToUSD: 1.13 },
};

/**
 * Convert any amount from one currency to target currency
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const fromRate = CURRENCIES[from]?.rateToUSD || 1.0;
  const toRate = CURRENCIES[to]?.rateToUSD || 1.0;
  
  // Convert from origin to USD, then USD to target
  const inUSD = amount * fromRate;
  const inTarget = inUSD / toRate;
  return inTarget;
}

/**
 * Format currency with appropriate symbol and decimals
 */
export function formatMoney(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  privacyMode: boolean = false
): string {
  if (privacyMode) return '••••••';
  
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const isZeroDecimal = currencyCode === 'JPY';
  
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${config.symbol}${formattedNumber}`;
}
