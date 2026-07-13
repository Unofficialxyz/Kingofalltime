import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'HKD' | 'KRW' | 'AUD' | 'CAD' | 'CHF' | 'SEK' | 'BRL' | 'SAR' | 'AED' | 'TRY' | 'ZAR' | 'NGN' | 'PLN' | 'DKK' | 'TWD' | 'SGD';

export interface CurrencyInfo { code: CurrencyCode; symbol: string; name: string; flag: string; }

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'HKD', symbol: 'HK$', name: 'HK Dollar', flag: '🇭🇰' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won', flag: '🇰🇷' },
  { code: 'AUD', symbol: 'A$', name: 'AU Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'CA Dollar', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'ZAR', symbol: 'R', name: 'SA Rand', flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', flag: '🇹🇼' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
];

const MAP = new Map(CURRENCIES.map((c) => [c.code, c]));
export function getCurrencyInfo(code: string): CurrencyInfo { return MAP.get(code as CurrencyCode) ?? CURRENCIES[0]; }

// Exchange rates: 1 unit of currency = X INR
export const INR_RATES: Record<CurrencyCode, number> = {
  INR: 1, USD: 83.5, EUR: 90.2, GBP: 105.8, JPY: 0.54, CNY: 11.5, HKD: 10.7,
  KRW: 0.061, AUD: 55.2, CAD: 61.0, CHF: 93.5, SEK: 7.8, BRL: 16.5, SAR: 22.3,
  AED: 22.7, TRY: 2.6, ZAR: 4.5, NGN: 0.055, PLN: 20.8, DKK: 12.1, TWD: 2.6, SGD: 62.0,
};

interface CurrencyCtx {
  display: CurrencyCode;
  setDisplay: (c: CurrencyCode) => void;
  convert: (amount: number, from: string) => number;
  formatPrice: (amount: number, from?: string) => string;
  formatCompact: (amount: number, from?: string) => string;
  symbol: string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState<CurrencyCode>('INR');

  const convert = useCallback((amount: number, from: string): number => {
    const fromRate = INR_RATES[from as CurrencyCode] ?? 83.5;
    const toRate = INR_RATES[display];
    return amount * fromRate / toRate;
  }, [display]);

  const formatPrice = useCallback((amount: number, from = 'USD'): string => {
    const converted = convert(amount, from);
    const info = getCurrencyInfo(display);
    const digits = display === 'JPY' || display === 'KRW' ? 0 : 2;
    return info.symbol + converted.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }, [convert, display]);

  const formatCompact = useCallback((amount: number, from = 'USD'): string => {
    const converted = convert(amount, from);
    const info = getCurrencyInfo(display);
    const abs = Math.abs(converted);
    let str: string;
    if (abs >= 1e12) str = (converted / 1e12).toFixed(2) + 'T';
    else if (abs >= 1e9) str = (converted / 1e9).toFixed(2) + 'B';
    else if (abs >= 1e7) str = (converted / 1e7).toFixed(2) + 'Cr';
    else if (abs >= 1e5) str = (converted / 1e5).toFixed(2) + 'L';
    else if (abs >= 1e3) str = (converted / 1e3).toFixed(2) + 'K';
    else str = converted.toFixed(0);
    return info.symbol + str;
  }, [convert, display]);

  const info = getCurrencyInfo(display);

  return (
    <Ctx.Provider value={{ display, setDisplay, convert, formatPrice, formatCompact, symbol: info.symbol }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
