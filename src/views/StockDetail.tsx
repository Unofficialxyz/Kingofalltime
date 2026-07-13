import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Star,
  Plus,
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  getQuote,
  getCandles,
  getFundamentals,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlows,
  getStockMeta,
} from "../lib/dataService";
import { analyzeTechnicals, scoreFundamentals } from "../lib/indicators";
import { forecast, recommend } from "../lib/forecast";
import { generateAIAnalysis, AI_AGENTS_COUNT } from "../lib/aiAnalysis";
import { useCurrency } from "../lib/currency";
import { useLiveQuote } from "../lib/hooks";
import { fmtPct, fmtNum, fmtDate, fmtCompact } from "../lib/format";
import type { Timeframe } from "../lib/types";

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
  onOpenStock: (s: string) => void;
  watched: boolean;
  onToggleWatch: (s: string) => void;
  onAddHolding: (s: string) => void;
}

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

const TABS = [
  "AI Analysis",
  "Overview",
  "Recommendation",
  "Technicals",
  "Fundamentals",
  "Financials",
  "Forecast",
  "Ownership",
] as const;

type Tab = (typeof TABS)[number];

function PriceChart({
  closes,
  positive,
}: {
  closes: number[];
  positive: boolean;
}) {
  const width = 760;
  const height = 240;
  const pad = 8;
  if (closes.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center text-slate-500 text-base">
        Not enough data to render chart
      </div>
    );
  }
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const step = (width - pad * 2) / (closes.length - 1);
  const color = positive ? "#10b981" : "#ef4444";
  const points = closes.map((c, i) => {
    const x = pad + i * step;
    const y = pad + (height - pad * 2) * (1 - (c - min) / range);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L${(width - pad).toFixed(1)},${(height - pad).toFixed(1)} L${pad.toFixed(1)},${(height - pad).toFixed(1)} Z`;
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pc-grad)" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      {sub ? <div className="mt-0.5 text-sm text-slate-400">{sub}</div> : null}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold text-white">
      <span className="text-emerald-400">{icon}</span>
      {children}
    </div>
  );
}

function sentimentColor(s: string): string {
  if (s.includes("Very Bullish")) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (s.includes("Bullish")) return "bg-green-500/20 text-green-300 border-green-500/40";
  if (s.includes("Very Bearish")) return "bg-red-500/20 text-red-300 border-red-500/40";
  if (s.includes("Bearish")) return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  return "bg-slate-500/20 text-slate-300 border-slate-500/40";
}

function actionColor(a: string): string {
  if (a === "Strong Buy") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (a === "Buy") return "bg-green-500/20 text-green-300 border-green-500/40";
  if (a === "Hold") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  if (a === "Sell") return "bg-orange-500/20 text-orange-300 border-orange-500/40";
  return "bg-red-500/20 text-red-300 border-red-500/40";
}

export function StockDetail(props: StockDetailProps) {
  const { symbol, onBack, onOpenStock, watched, onToggleWatch, onAddHolding } = props;
  const [tab, setTab] = useState<Tab>("AI Analysis");
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const { formatPrice, formatCompact } = useCurrency();

  const meta = useMemo(() => getStockMeta(symbol), [symbol]);
  const quote = useLiveQuote(symbol);

  const data = useMemo(() => {
    const baseQuote = getQuote(symbol);
    const candles = getCandles(symbol, timeframe);
    const fund = getFundamentals(symbol);
    const tech = analyzeTechnicals(candles);
    const fundScore = scoreFundamentals(fund);
    const fc = forecast(candles, fund, tech);
    const rec = recommend(tech, fundScore.grade, fc);
    const ai = generateAIAnalysis(symbol, candles, fund, tech, fundScore, fc, rec);
    const income = getIncomeStatements(symbol);
    const balance = getBalanceSheets(symbol);
    const cash = getCashFlows(symbol);
    return { baseQuote, candles, fund, tech, fundScore, fc, rec, ai, income, balance, cash };
  }, [symbol, timeframe]);

  const liveQuote = quote ?? data.baseQuote;
  const up = liveQuote.changePct >= 0;
  const closes = data.candles.map((c) => c.c);

  // Fake ownership data derived deterministically from symbol
  const ownership = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < symbol.length; i++) {
      h ^= symbol.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let a = (h >>> 0) || 1;
    const rand = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const inst = [
      { name: "Vanguard Group", pct: 8 + rand() * 6 },
      { name: "BlackRock Inc.", pct: 6 + rand() * 6 },
      { name: "Fidelity Mgmt", pct: 4 + rand() * 5 },
      { name: "State Street", pct: 3 + rand() * 4 },
      { name: "T. Rowe Price", pct: 2 + rand() * 4 },
      { name: "Other Institutions", pct: 10 + rand() * 8 },
    ];
    const total = inst.reduce((s, x) => s + x.pct, 0);
    inst.forEach((x) => (x.pct = (x.pct / total) * 100));
    const insiders = [
      { name: "CEO Holdings", pct: 1 + rand() * 3 },
      { name: "CFO Holdings", pct: 0.5 + rand() * 1.5 },
      { name: "Director Shares", pct: 0.3 + rand() * 1.2 },
    ];
    const majors = [
      { name: "Goldman Sachs", shares: Math.floor(1e6 + rand() * 5e7) },
      { name: "Morgan Stanley", shares: Math.floor(1e6 + rand() * 4e7) },
      { name: "JPMorgan Chase", shares: Math.floor(1e6 + rand() * 3e7) },
      { name: "Bank of America", shares: Math.floor(5e5 + rand() * 2e7) },
    ];
    return { inst, insiders, majors };
  }, [symbol]);

  const pieColors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-base text-slate-200 hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{symbol}</h1>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-sm text-slate-300">
                  {meta.exchange}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-sm text-slate-300">
                  {meta.sector}
                </span>
              </div>
              <div className="text-sm text-slate-400">{meta.name}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {formatPrice(liveQuote.price)}
              </div>
              <div
                className={`flex items-center justify-end gap-1 text-base font-semibold ${
                  up ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {fmtPct(liveQuote.changePct)} ({formatPrice(liveQuote.change)})
              </div>
            </div>
            <button
              onClick={() => onToggleWatch(symbol)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-base ${
                watched
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              <Star className={`h-5 w-5 ${watched ? "fill-amber-400" : ""}`} />
              {watched ? "Watching" : "Watch"}
            </button>
            <button
              onClick={() => onAddHolding(symbol)}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-2 text-base text-emerald-300 hover:bg-emerald-500/30"
            >
              <Plus className="h-5 w-5" />
              Add to Portfolio
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg border px-3 py-1.5 text-base ${
                  timeframe === tf
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg border px-3 py-1.5 text-base ${
                  tab === t
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {tab === "AI Analysis" && (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-base text-emerald-300">
                <Brain className="h-5 w-5" />
                {AI_AGENTS_COUNT.toLocaleString()} AI Agents
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-base text-cyan-300">
                <Zap className="h-5 w-5" />
                1000+ Techniques Applied
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Brain className="h-5 w-5" />}>AI Summary</SectionTitle>
              <p className="mt-3 text-base leading-relaxed text-slate-200">{data.ai.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-lg border px-3 py-1.5 text-base font-semibold ${sentimentColor(
                    data.ai.sentiment
                  )}`}
                >
                  {data.ai.sentiment}
                </span>
                <span className="text-base text-slate-300">
                  Sentiment Score:{" "}
                  <span className="font-semibold text-white">
                    {data.ai.sentimentScore >= 0 ? "+" : ""}
                    {data.ai.sentimentScore}
                  </span>
                </span>
                <span className="text-base text-slate-300">
                  AI Confidence:{" "}
                  <span className="font-semibold text-white">{data.ai.aiConfidence}%</span>
                </span>
              </div>
            </div>

            {/* Bull / Bear */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-5">
                <SectionTitle icon={<TrendingUp className="h-5 w-5" />}>Bull Case</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {data.ai.bullCase.length === 0 ? (
                    <li className="text-base text-slate-400">No strong bullish signals detected.</li>
                  ) : (
                    data.ai.bullCase.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-base text-slate-200">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                        {b}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-5">
                <SectionTitle icon={<TrendingDown className="h-5 w-5" />}>Bear Case</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {data.ai.bearCase.length === 0 ? (
                    <li className="text-base text-slate-400">No strong bearish signals detected.</li>
                  ) : (
                    data.ai.bearCase.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-base text-slate-200">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                        {b}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {/* Pattern + ESG + Options + Insider */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<BarChart3 className="h-5 w-5" />}>Pattern Recognition</SectionTitle>
                <p className="mt-3 text-base text-slate-200">{data.ai.patternRecognition}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<Activity className="h-5 w-5" />}>ESG Score</SectionTitle>
                <div className="mt-3 flex items-center gap-3">
                  <div className="text-3xl font-bold text-white">{data.ai.esgScore}</div>
                  <div className="text-base text-slate-400">/ 100</div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${data.ai.esgScore}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<DollarSign className="h-5 w-5" />}>Options Flow</SectionTitle>
                <p className="mt-3 text-base text-slate-200">{data.ai.optionsFlow}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<Activity className="h-5 w-5" />}>Insider Activity</SectionTitle>
                <p className="mt-3 text-base text-slate-200">{data.ai.insiderActivity}</p>
              </div>
            </div>

            {/* Catalysts + Risks */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-cyan-700/50 bg-cyan-900/20 p-5">
                <SectionTitle icon={<Zap className="h-5 w-5" />}>Catalysts</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {data.ai.catalysts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-slate-200">
                      <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-5">
                <SectionTitle icon={<AlertTriangle className="h-5 w-5" />}>Risk Factors</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {data.ai.riskFactors.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-slate-200">
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key levels + trading suggestion */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<Target className="h-5 w-5" />}>Key Levels</SectionTitle>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-slate-400">Support</div>
                    <div className="text-lg font-semibold text-emerald-400">
                      {formatPrice(data.ai.keyLevels.support)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Resistance</div>
                    <div className="text-lg font-semibold text-red-400">
                      {formatPrice(data.ai.keyLevels.resistance)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
                <SectionTitle icon={<Brain className="h-5 w-5" />}>Trading Suggestion</SectionTitle>
                <p className="mt-3 text-base text-slate-200">{data.ai.tradingSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "Overview" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<BarChart3 className="h-5 w-5" />}>
                Price Chart ({timeframe})
              </SectionTitle>
              <div className="mt-4">
                <PriceChart closes={closes} positive={up} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Price" value={formatPrice(liveQuote.price)} />
              <StatCard
                label="Change"
                value={fmtPct(liveQuote.changePct)}
                sub={formatPrice(liveQuote.change)}
              />
              <StatCard label="Volume" value={fmtCompact(liveQuote.volume)} />
              <StatCard label="Market Cap" value={formatCompact(liveQuote.marketCap)} />
              <StatCard
                label="52W High"
                value={formatPrice(liveQuote.high52)}
              />
              <StatCard
                label="52W Low"
                value={formatPrice(liveQuote.low52)}
              />
              <StatCard label="P/E Ratio" value={fmtNum(liveQuote.pe)} />
              <StatCard label="P/B Ratio" value={fmtNum(liveQuote.pb)} />
              <StatCard
                label="Dividend Yield"
                value={fmtPct(liveQuote.divYield)}
              />
              <StatCard label="Beta" value={fmtNum(liveQuote.beta)} />
              <StatCard label="Open" value={formatPrice(liveQuote.open)} />
              <StatCard label="Prev Close" value={formatPrice(liveQuote.prevClose)} />
            </div>
          </div>
        )}

        {tab === "Recommendation" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Target className="h-5 w-5" />}>AI Recommendation</SectionTitle>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-lg border px-4 py-2 text-lg font-bold ${actionColor(
                    data.rec.action
                  )}`}
                >
                  {data.rec.action}
                </span>
                <span className="text-base text-slate-300">
                  Confidence:{" "}
                  <span className="font-semibold text-white">
                    {Math.round(data.rec.confidence * 100)}%
                  </span>
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Target Price" value={formatPrice(data.rec.targetPrice)} />
              <StatCard label="Stop Loss" value={formatPrice(data.rec.stopLoss)} />
              <StatCard label="Risk Level" value={data.rec.riskLevel} />
              <StatCard label="Time Horizon" value={data.rec.timeHorizon} />
              <StatCard
                label="Confidence"
                value={`${Math.round(data.rec.confidence * 100)}%`}
              />
              <StatCard
                label="Upside"
                value={fmtPct(
                  ((data.rec.targetPrice - liveQuote.price) / liveQuote.price) * 100
                )}
              />
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Brain className="h-5 w-5" />}>Rationale</SectionTitle>
              <ul className="mt-3 space-y-2">
                {data.rec.rationale.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-base text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "Technicals" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="RSI (14)" value={fmtNum(data.tech.rsi)} sub="Momentum" />
              <StatCard label="MACD" value={fmtNum(data.tech.macd)} sub={`Signal ${fmtNum(data.tech.macdSignal)}`} />
              <StatCard label="SMA 50" value={formatPrice(data.tech.sma50)} />
              <StatCard label="SMA 200" value={formatPrice(data.tech.sma200)} />
              <StatCard label="EMA 12" value={formatPrice(data.tech.ema12)} />
              <StatCard label="EMA 26" value={formatPrice(data.tech.ema26)} />
              <StatCard
                label="Bollinger Upper"
                value={formatPrice(data.tech.bollUpper)}
              />
              <StatCard
                label="Bollinger Lower"
                value={formatPrice(data.tech.bollLower)}
              />
              <StatCard label="ATR (14)" value={fmtNum(data.tech.atr)} />
              <StatCard label="ADX (14)" value={fmtNum(data.tech.adx)} />
              <StatCard label="Stochastic %K" value={fmtNum(data.tech.stoch)} />
              <StatCard label="VWAP" value={formatPrice(data.tech.vwap)} />
              <StatCard label="OBV" value={fmtCompact(data.tech.obv)} />
              <StatCard label="CCI (20)" value={fmtNum(data.tech.cci)} />
              <StatCard label="Williams %R" value={fmtNum(data.tech.williamsR)} />
              <StatCard label="MFI (14)" value={fmtNum(data.tech.mfi)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Trend" value={data.tech.trend} />
              <StatCard label="Momentum" value={data.tech.momentum} />
              <StatCard label="Volatility" value={data.tech.volatility} />
            </div>
          </div>
        )}

        {tab === "Fundamentals" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<BarChart3 className="h-5 w-5" />}>Fundamental Score</SectionTitle>
              <div className="mt-4 flex items-center gap-4">
                <div className="text-5xl font-bold text-emerald-400">{data.fundScore.grade}</div>
                <div>
                  <div className="text-2xl font-semibold text-white">
                    {data.fundScore.score}
                    <span className="text-base text-slate-400"> / 100</span>
                  </div>
                  <div className="text-base text-slate-400">Fundamental Grade</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Activity className="h-5 w-5" />}>Score Breakdown</SectionTitle>
              <div className="mt-4 space-y-3">
                {data.fundScore.details.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-slate-200">{d.label}</span>
                      <span className="text-slate-400">
                        {fmtNum(d.value)} / {fmtNum(d.score, 1)} pts
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (d.score / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Financials" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<DollarSign className="h-5 w-5" />}>Income Statements</SectionTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="py-2 pr-4">Year</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2 pr-4">Gross Profit</th>
                      <th className="py-2 pr-4">Operating Income</th>
                      <th className="py-2 pr-4">Net Income</th>
                      <th className="py-2 pr-4">EPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.income.map((row) => (
                      <tr key={row.year} className="border-b border-slate-800">
                        <td className="py-2 pr-4 text-slate-300">{row.year}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.revenue)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.grossProfit)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.operatingIncome)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.netIncome)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtNum(row.eps)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<BarChart3 className="h-5 w-5" />}>Balance Sheets</SectionTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="py-2 pr-4">Year</th>
                      <th className="py-2 pr-4">Total Assets</th>
                      <th className="py-2 pr-4">Total Liabilities</th>
                      <th className="py-2 pr-4">Equity</th>
                      <th className="py-2 pr-4">Total Debt</th>
                      <th className="py-2 pr-4">Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.balance.map((row) => (
                      <tr key={row.year} className="border-b border-slate-800">
                        <td className="py-2 pr-4 text-slate-300">{row.year}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.totalAssets)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.totalLiabilities)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.equity)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.totalDebt)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.cash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Activity className="h-5 w-5" />}>Cash Flows</SectionTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="py-2 pr-4">Year</th>
                      <th className="py-2 pr-4">Operating</th>
                      <th className="py-2 pr-4">Investing</th>
                      <th className="py-2 pr-4">Financing</th>
                      <th className="py-2 pr-4">Free Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cash.map((row) => (
                      <tr key={row.year} className="border-b border-slate-800">
                        <td className="py-2 pr-4 text-slate-300">{row.year}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.operating)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.investing)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.financing)}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtCompact(row.freeCashFlow)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "Forecast" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<TrendingUp className="h-5 w-5" />}>AI Forecast</SectionTitle>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="text-base text-slate-300">
                  Trend Direction:{" "}
                  <span className="font-semibold text-white">{data.fc.trendDirection}</span>
                </span>
                <span className="text-base text-slate-300">
                  Expected Return:{" "}
                  <span
                    className={`font-semibold ${
                      data.fc.expectedReturn >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmtPct(data.fc.expectedReturn)}
                  </span>
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label={`Short Term (${data.fc.short.period})`}
                value={formatPrice(data.fc.short.targetPrice)}
                sub={`Low ${formatPrice(data.fc.short.low)} / High ${formatPrice(data.fc.short.high)}`}
              />
              <StatCard
                label={`Medium Term (${data.fc.medium.period})`}
                value={formatPrice(data.fc.medium.targetPrice)}
                sub={`Low ${formatPrice(data.fc.medium.low)} / High ${formatPrice(data.fc.medium.high)}`}
              />
              <StatCard
                label={`Long Term (${data.fc.long.period})`}
                value={formatPrice(data.fc.long.targetPrice)}
                sub={`Low ${formatPrice(data.fc.long.low)} / High ${formatPrice(data.fc.long.high)}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Short Confidence"
                value={`${Math.round(data.fc.short.confidence * 100)}%`}
              />
              <StatCard
                label="Medium Confidence"
                value={`${Math.round(data.fc.medium.confidence * 100)}%`}
              />
              <StatCard
                label="Long Confidence"
                value={`${Math.round(data.fc.long.confidence * 100)}%`}
              />
            </div>
          </div>
        )}

        {tab === "Ownership" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<BarChart3 className="h-5 w-5" />}>
                Institutional Holdings
              </SectionTitle>
              <div className="mt-4 flex flex-col items-center gap-6 md:flex-row">
                <svg viewBox="0 0 200 200" width="220" height="220" className="flex-shrink-0">
                  {(() => {
                    let acc = 0;
                    return ownership.inst.map((seg, i) => {
                      const start = acc;
                      acc += seg.pct;
                      const a0 = (start / 100) * 2 * Math.PI - Math.PI / 2;
                      const a1 = (acc / 100) * 2 * Math.PI - Math.PI / 2;
                      const large = seg.pct > 50 ? 1 : 0;
                      const x0 = 100 + 90 * Math.cos(a0);
                      const y0 = 100 + 90 * Math.sin(a0);
                      const x1 = 100 + 90 * Math.cos(a1);
                      const y1 = 100 + 90 * Math.sin(a1);
                      return (
                        <path
                          key={i}
                          d={`M100,100 L${x0.toFixed(1)},${y0.toFixed(1)} A90,90 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`}
                          fill={pieColors[i % pieColors.length]}
                          stroke="#0f172a"
                          strokeWidth={1.5}
                        />
                      );
                    });
                  })()}
                  <circle cx="100" cy="100" r="40" fill="#0f172a" stroke="#1e293b" strokeWidth={2} />
                  <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#e2e8f0"
                    fontSize="14"
                    fontWeight="700"
                  >
                    Inst.
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  {ownership.inst.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 text-base">
                      <span
                        className="h-4 w-4 flex-shrink-0 rounded"
                        style={{ backgroundColor: pieColors[i % pieColors.length] }}
                      />
                      <span className="flex-1 text-slate-200">{seg.name}</span>
                      <span className="font-semibold text-white">{fmtNum(seg.pct)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<Activity className="h-5 w-5" />}>Insider Holdings</SectionTitle>
              <div className="mt-4 space-y-2">
                {ownership.insiders.map((ins, i) => (
                  <div key={i} className="flex items-center justify-between text-base">
                    <span className="text-slate-200">{ins.name}</span>
                    <span className="font-semibold text-white">{fmtNum(ins.pct)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5">
              <SectionTitle icon={<DollarSign className="h-5 w-5" />}>Major Shareholders</SectionTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="py-2 pr-4">Institution</th>
                      <th className="py-2 pr-4">Shares Held</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownership.majors.map((m, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="py-2 pr-4 text-slate-200">{m.name}</td>
                        <td className="py-2 pr-4 text-slate-200">{fmtNum(m.shares, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer quick nav */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex flex-wrap gap-2 border-t border-slate-700/60 pt-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg border px-3 py-1.5 text-base ${
                tab === t
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-500">
          {meta.name} ({symbol}) on {meta.exchange} - {meta.region} - {meta.sector}
        </div>
      </div>
    </div>
  );
}

export default StockDetail;
