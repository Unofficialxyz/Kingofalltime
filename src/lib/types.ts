export type Exchange = "NSE" | "BSE" | "NASDAQ" | "NYSE" | "LSE" | "TSE" | "HKEX" | "SSE" | "ASX" | "TSX" | "KRX" | "EURONEXT" | "XETR" | "SIX" | "OMX" | "BME" | "BITA" | "BVMF" | "JSE" | "TPEX" | "SGX" | "BIST" | "TADAWUL" | "IDX" | "SET" | "KLSE" | "PSE" | "HOSE" | "VIRTUAL";

export type Region = "India" | "USA" | "Europe" | "Japan" | "China" | "HongKong" | "Australia" | "Canada" | "Korea" | "Taiwan" | "Singapore" | "Brazil" | "Mexico" | "SouthAfrica" | "SaudiArabia" | "UAE" | "Turkey" | "Indonesia" | "Thailand" | "Malaysia" | "Philippines" | "Vietnam" | "Bangladesh" | "SriLanka" | "Egypt" | "Russia" | "Poland" | "Sweden" | "Spain" | "Italy" | "Germany" | "France" | "Netherlands" | "Switzerland" | "Virtual";

export type Sector =
  | "Technology" | "AI" | "Finance" | "Healthcare" | "Energy" | "Consumer"
  | "Industrial" | "Materials" | "Utilities" | "RealEstate" | "Communication"
  | "Semiconductors" | "EV" | "Fintech" | "Biotech" | "Robotics" | "CloudComputing"
  | "Cybersecurity" | "QuantumComputing" | "RenewableEnergy" | "ECommerce" | "EdTech"
  | "AgriTech" | "SpaceTech" | "Logistics" | "Media" | "Gaming" | "Travel"
  | "Food" | "Retail" | "Automotive" | "Aerospace" | "Defense" | "Pharma"
  | "Chemicals" | "Construction" | "Mining" | "Steel" | "Textiles" | "Telecom";

export interface StockMeta {
  symbol: string;
  name: string;
  exchange: Exchange;
  region: Region;
  sector: Sector;
  isAI?: boolean;
  isVirtual?: boolean;
  index?: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  high52: number;
  low52: number;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  pe: number;
  pb: number;
  divYield: number;
  beta: number;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Fundamentals {
  revenue: number;
  revenueGrowth: number;
  netIncome: number;
  netMargin: number;
  debtToEquity: number;
  roe: number;
  roa: number;
  currentRatio: number;
  quickRatio: number;
  grossMargin: number;
  operatingMargin: number;
  eps: number;
  bookValue: number;
  freeCashFlow: number;
  payoutRatio: number;
  pegRatio: number;
}

export interface IncomeStatement {
  year: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

export interface BalanceSheet {
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  totalDebt: number;
  cash: number;
}

export interface CashFlow {
  year: number;
  operating: number;
  investing: number;
  financing: number;
  freeCashFlow: number;
}

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";
