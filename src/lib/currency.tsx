import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CurrencyInfo { code: string; symbol: string; name: string; flag: string }

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "KRW", symbol: "₩", name: "Korean Won", flag: "🇰🇷" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", flag: "🇻🇳" },
];

const INR_RATES: Record<string, number> = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.75, CNY: 0.087,
  AUD: 0.018, CAD: 0.016, KRW: 16.2, SGD: 0.016, HKD: 0.094, BRL: 0.061,
  MXN: 0.21, ZAR: 0.22, SAR: 0.045, AED: 0.044, TRY: 0.39, IDR: 188,
  THB: 0.43, MYR: 0.056, PHP: 0.70, VND: 305,
};

interface CurrencyCtx {
  display: string; setDisplay: (c: string) => void;
  convert: (inr: number) => number;
  formatPrice: (inr: number) => string;
  formatCompact: (inr: number) => string;
  symbol: string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

function formatIndian(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function formatCompactGeneric(n: number, sym: string): string {
  if (Math.abs(n) >= 1e15) return sym + (n / 1e15).toFixed(2) + "Q";
  if (Math.abs(n) >= 1e12) return sym + (n / 1e12).toFixed(2) + "T";
  if (Math.abs(n) >= 1e9) return sym + (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return sym + (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return sym + (n / 1e3).toFixed(2) + "K";
  return sym + n.toFixed(2);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState("INR");
  const rate = INR_RATES[display] ?? 1;
  const info = CURRENCIES.find((c) => c.code === display)!;
  const convert = useCallback((inr: number) => inr * rate, [rate]);
  const formatPrice = useCallback((inr: number) => {
    const v = inr * rate;
    if (display === "INR") return info.symbol + formatIndian(v);
    if (["JPY", "KRW", "VND", "IDR"].includes(display)) return info.symbol + Math.round(v).toLocaleString();
    return info.symbol + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [rate, display, info]);
  const formatCompact = useCallback((inr: number) => {
    const v = inr * rate;
    if (display === "INR") {
      if (Math.abs(v) >= 1e7) return info.symbol + (v / 1e7).toFixed(2) + "Cr";
      if (Math.abs(v) >= 1e5) return info.symbol + (v / 1e5).toFixed(2) + "L";
      return formatCompactGeneric(v, info.symbol);
    }
    return formatCompactGeneric(v, info.symbol);
  }, [rate, display, info]);
  return <Ctx.Provider value={{ display, setDisplay, convert, formatPrice, formatCompact, symbol: info.symbol }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider");
  return ctx;
}
