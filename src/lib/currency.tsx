import { createContext, useContext, useState, useCallback, ReactNode } from "react";
export type CurrencyCode = "INR"|"USD"|"EUR"|"GBP"|"JPY"|"CNY"|"HKD"|"KRW"|"AUD"|"CAD"|"CHF"|"SEK"|"BRL"|"SAR"|"AED"|"TRY"|"ZAR"|"NGN"|"PLN"|"DKK"|"TWD"|"SGD";
export interface CurrencyInfo { code: CurrencyCode; symbol: string; name: string; flag: string; }
export const CURRENCIES: CurrencyInfo[] = [
  { code:"INR",symbol:"\u20B9",name:"Indian Rupee",flag:"\u{1F1EE}\u{1F1F3}" },
  { code:"USD",symbol:"$",name:"US Dollar",flag:"\u{1F1FA}\u{1F1F8}" },
  { code:"EUR",symbol:"\u20AC",name:"Euro",flag:"\u{1F1EA}\u{1F1FA}" },
  { code:"GBP",symbol:"\u00A3",name:"British Pound",flag:"\u{1F1EC}\u{1F1E7}" },
  { code:"JPY",symbol:"\u00A5",name:"Japanese Yen",flag:"\u{1F1EF}\u{1F1F5}" },
  { code:"CNY",symbol:"\u00A5",name:"Chinese Yuan",flag:"\u{1F1E8}\u{1F1F3}" },
  { code:"HKD",symbol:"HK$",name:"HK Dollar",flag:"\u{1F1ED}\u{1F1F0}" },
  { code:"KRW",symbol:"\u20A9",name:"Korean Won",flag:"\u{1F1F0}\u{1F1F7}" },
  { code:"AUD",symbol:"A$",name:"AU Dollar",flag:"\u{1F1E6}\u{1F1FA}" },
  { code:"CAD",symbol:"C$",name:"CA Dollar",flag:"\u{1F1E8}\u{1F1E6}" },
  { code:"CHF",symbol:"Fr",name:"Swiss Franc",flag:"\u{1F1E8}\u{1F1ED}" },
  { code:"SEK",symbol:"kr",name:"Swedish Krona",flag:"\u{1F1F8}\u{1F1EA}" },
  { code:"BRL",symbol:"R$",name:"Brazilian Real",flag:"\u{1F1E7}\u{1F1F7}" },
  { code:"SAR",symbol:"\uFDFC",name:"Saudi Riyal",flag:"\u{1F1F8}\u{1F1E6}" },
  { code:"AED",symbol:"\u062F.\u0625",name:"UAE Dirham",flag:"\u{1F1E6}\u{1F1EA}" },
  { code:"TRY",symbol:"\u20BA",name:"Turkish Lira",flag:"\u{1F1F9}\u{1F1F7}" },
  { code:"ZAR",symbol:"R",name:"SA Rand",flag:"\u{1F1FF}\u{1F1E6}" },
  { code:"NGN",symbol:"\u20A6",name:"Nigerian Naira",flag:"\u{1F1F3}\u{1F1EC}" },
  { code:"PLN",symbol:"z\u0142",name:"Polish Zloty",flag:"\u{1F1F5}\u{1F1F1}" },
  { code:"DKK",symbol:"kr",name:"Danish Krone",flag:"\u{1F1E9}\u{1F1F0}" },
  { code:"TWD",symbol:"NT$",name:"Taiwan Dollar",flag:"\u{1F1F9}\u{1F1FC}" },
  { code:"SGD",symbol:"S$",name:"Singapore Dollar",flag:"\u{1F1F8}\u{1F1EC}" },
];
const MAP = new Map(CURRENCIES.map((c) => [c.code, c]));
export function getCurrencyInfo(code: string): CurrencyInfo { return MAP.get(code as CurrencyCode) ?? CURRENCIES[0]; }
export const INR_RATES: Record<CurrencyCode, number> = { INR:1,USD:83.5,EUR:90.2,GBP:105.8,JPY:0.54,CNY:11.5,HKD:10.7,KRW:0.061,AUD:55.2,CAD:61.0,CHF:93.5,SEK:7.8,BRL:16.5,SAR:22.3,AED:22.7,TRY:2.6,ZAR:4.5,NGN:0.055,PLN:20.8,DKK:12.1,TWD:2.6,SGD:62.0 };
interface CurrencyCtx { display: CurrencyCode; setDisplay: (c: CurrencyCode) => void; convert: (amount: number, from: string) => number; formatPrice: (amount: number, from?: string) => string; formatCompact: (amount: number, from?: string) => string; symbol: string; }
const Ctx = createContext<CurrencyCtx | null>(null);
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState<CurrencyCode>("INR");
  const convert = useCallback((amount: number, from: string): number => { const fr = INR_RATES[from as CurrencyCode] ?? 83.5; const tr = INR_RATES[display]; return amount * fr / tr; }, [display]);
  const formatPrice = useCallback((amount: number, from = "USD"): string => { const v = convert(amount, from); const info = getCurrencyInfo(display); const d = display === "JPY" || display === "KRW" ? 0 : 2; return info.symbol + v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }); }, [convert, display]);
  const formatCompact = useCallback((amount: number, from = "USD"): string => { const v = convert(amount, from); const info = getCurrencyInfo(display); const a = Math.abs(v); let s: string; if (a >= 1e15) s = (v/1e15).toFixed(2)+"Q"; else if (a >= 1e12) s = (v/1e12).toFixed(2)+"T"; else if (a >= 1e9) s = (v/1e9).toFixed(2)+"B"; else if (a >= 1e7) s = (v/1e7).toFixed(2)+"Cr"; else if (a >= 1e5) s = (v/1e5).toFixed(2)+"L"; else if (a >= 1e3) s = (v/1e3).toFixed(2)+"K"; else s = v.toFixed(0); return info.symbol + s; }, [convert, display]);
  const info = getCurrencyInfo(display);
  return <Ctx.Provider value={{ display, setDisplay, convert, formatPrice, formatCompact, symbol: info.symbol }}>{children}</Ctx.Provider>;
}
export function useCurrency() { const ctx = useContext(Ctx); if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider"); return ctx; }
