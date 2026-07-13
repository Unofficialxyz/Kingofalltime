import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Star,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Gauge,
  BarChart3,
  Wallet,
  LineChart,
  Layers,
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  Users,
  DollarSign,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  getMeta,
  getCandles,
  getFundamentals,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlows,
} from "../lib/dataService";
import { useLiveQuote } from "../lib/hooks";
import { analyzeTechnicals, scoreFundamentals } from "../lib/indicators";
import { forecast, recommend } from "../lib/forecast";
import { generateAIAnalysis } from "../lib/aiAnalysis";
import { useCurrency } from "../lib/currency";
import { fmtNum, fmtPct, fmtPctRaw, fmtCompact } from "../lib/format";
import type { Timeframe, Candle, Fundamentals } from "../lib/types";
import type { ForecastSet, Recommendation } from "../lib/forecast";
import type { AIAnalysis } from "../lib/aiAnalysis";
import type { TechnicalSummary, FundamentalScore } from "../lib/indicators";
import { Sparkline } from "../components/Sparkline";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
  onOpenStock: (s: string) => void;
  watched: boolean;
  onToggleWatch: (s: string) => void;
  onAddHolding: (s: string) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TIMEFRAMES: Timeframe[] = ["1W", "1M", "3M", "6M", "1Y", "5Y"];

type TabId =
  | "overview"
  | "ai"
  | "recommendation"
  | "technicals"
  | "fundamentals"
  | "financials"
  | "forecast"
  | "ownership";

type IconType = React.ComponentType<{ className?: string }>;

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "ai", label: "AI Analysis", icon: Brain },
  { id: "recommendation", label: "Recommendation", icon: Target },
  { id: "technicals", label: "Technicals", icon: Activity },
  { id: "fundamentals", label: "Fundamentals", icon: Scale },
  { id: "financials", label: "Financials", icon: BarChart3 },
  { id: "forecast", label: "Forecast", icon: LineChart },
  { id: "ownership", label: "Ownership", icon: Users },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function actionColor(action: string): string {
  if (action.includes("Strong Buy")) return "text-bull";
  if (action.includes("Buy")) return "text-bull";
  if (action.includes("Strong Sell")) return "text-bear";
  if (action.includes("Sell")) return "text-bear";
  return "text-accent-400";
}

function actionBg(action: string): string {
  if (action.includes("Buy")) return "bg-bull/10 border-bull/30 text-bull";
  if (action.includes("Sell")) return "bg-bear/10 border-bear/30 text-bear";
  return "bg-accent-400/10 border-accent-400/30 text-accent-400";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-bull";
  if (score >= 50) return "text-accent-400";
  if (score >= 30) return "text-ink-300";
  return "text-bear";
}

function gradeColor(grade: string): string {
  if (grade === "A") return "text-bull";
  if (grade === "B") return "text-bull";
  if (grade === "C") return "text-accent-400";
  if (grade === "D") return "text-ink-300";
  return "text-bear";
}

// ─── PriceChart (SVG) ─────────────────────────────────────────────────────────

function PriceChart({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  const W = 800;
  const H = 280;
  const PAD = 8;
  if (!candles.length || candles.length < 2) {
    return (
      <div className="flex items-center justify-center h-[280px] text-ink-500 text-sm">
        No chart data available
      </div>
    );
  }
  const closes = candles.map((c) => c.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (closes.length - 1);
  const y = (p: number) => H - PAD - ((p - min) / range) * (H - PAD * 2);
  const x = (i: number) => PAD + i * stepX;
  const linePath = closes
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`)
    .join(" ");
  const areaPath = linePath + ` L${x(closes.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const stroke = positive ? "#10b981" : "#ef4444";
  const fill = positive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
  const gridLines = [0.25, 0.5, 0.75].map((f) => PAD + f * (H - PAD * 2));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[280px]" preserveAspectRatio="none">
      {gridLines.map((gy, i) => (
        <line key={i} x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Small reusable bits ───────────────────────────────────────────────────────

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className="text-sm font-mono text-ink-100">{value}</div>
      {sub ? <div className="text-xs text-ink-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: IconType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-brand-400" />
      <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
    </div>
  );
}

function ListBlock({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "bull" | "bear" | "risk" }) {
  const dot =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "risk" ? "text-bear" : "text-brand-400";
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-ink-300">
          <span className={`${dot} mt-0.5`}>&#8226;</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = score >= 70 ? "bg-bull" : score >= 50 ? "bg-accent-400" : score >= 30 ? "bg-ink-400" : "bg-bear";
  return (
    <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StockDetail({
  symbol,
  onBack,
  onOpenStock,
  watched,
  onToggleWatch,
  onAddHolding,
}: StockDetailProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [tab, setTab] = useState<TabId>("overview");
  const { formatPrice, formatCompact } = useCurrency();

  const meta = useMemo(() => getMeta(symbol), [symbol]);
  const quote = useLiveQuote(symbol);

  const candles = useMemo(() => getCandles(symbol, timeframe), [symbol, timeframe]);
  const fund: Fundamentals = useMemo(() => getFundamentals(symbol), [symbol]);
  const income = useMemo(() => getIncomeStatements(symbol), [symbol]);
  const balance = useMemo(() => getBalanceSheets(symbol), [symbol]);
  const cashflow = useMemo(() => getCashFlows(symbol), [symbol]);

  const tech: TechnicalSummary | null = useMemo(() => analyzeTechnicals(candles), [candles]);
  const fundScore: FundamentalScore = useMemo(() => scoreFundamentals(fund), [fund]);
  const fc: ForecastSet | null = useMemo(() => (tech ? forecast(candles, fund, tech) : null), [candles, fund, tech]);
  const rec: Recommendation | null = useMemo(
    () => (tech && fc ? recommend(tech, fundScore.grade, fc, fund) : null),
    [tech, fc, fundScore, fund]
  );
  const ai: AIAnalysis | null = useMemo(
    () => (tech && fc && rec ? generateAIAnalysis(symbol, candles, fund, tech, fc, rec) : null),
    [symbol, candles, fund, tech, fc, rec]
  );

  if (!meta) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="btn-outline mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8 text-center text-ink-400">Stock "{symbol}" not found.</div>
      </div>
    );
  }

  const price = quote ? quote.price : 0;
  const change = quote ? quote.change : 0;
  const changePct = quote ? quote.changePct : 0;
  const positive = change >= 0;
  const sparkPoints = candles.map((c) => c.c).slice(-30);

  // ─── Header ─────────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={onBack} className="btn-outline" aria-label="Back">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <div className="text-xl font-bold text-ink-100">{symbol}</div>
        <span className="chip bg-ink-800 text-ink-400">{meta.exchange}</span>
        <span className="chip bg-ink-800 text-ink-400">{meta.region}</span>
      </div>
      <div className="text-sm text-ink-500 truncate hidden sm:block">{meta.name}</div>
      <div className="flex-1" />
      <button
        onClick={() => onToggleWatch(symbol)}
        className={watched ? "btn-primary" : "btn-outline"}
        aria-label="Toggle watch"
      >
        <Star className={`w-4 h-4 ${watched ? "fill-current" : ""}`} />
        {watched ? "Watching" : "Watch"}
      </button>
      <button onClick={() => onAddHolding(symbol)} className="btn-outline" aria-label="Add to portfolio">
        <Plus className="w-4 h-4" /> Portfolio
      </button>
    </div>
  );

  // ─── Price bar ──────────────────────────────────────────────────────────────
  const priceBar = (
    <div className="card p-4 flex flex-wrap items-center gap-4">
      <div>
        <div className="text-2xl font-mono font-semibold text-ink-100">
          {formatPrice(price, meta.currency)}
        </div>
        <div className={`text-sm font-mono ${positive ? "text-bull" : "text-bear"}`}>
          {positive ? "+" : ""}
          {formatPrice(change, meta.currency)} ({positive ? "+" : ""}
          {fmtPctRaw(changePct)})
        </div>
      </div>
      <div className="shrink-0">
        <Sparkline points={sparkPoints} positive={positive} width={140} height={44} />
      </div>
      <div className="flex-1" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-[260px]">
        <StatTile label="Mkt Cap" value={formatCompact(quote ? quote.marketCap : 0, meta.currency)} />
        <StatTile label="P/E" value={fmtNum(quote ? quote.pe : 0, 1)} />
        <StatTile label="Volume" value={fmtCompact(quote ? quote.volume : 0)} />
        <StatTile label="52W Range" value={`${formatPrice(quote ? quote.yearLow : 0, meta.currency)} - ${formatPrice(quote ? quote.yearHigh : 0, meta.currency)}`} />
      </div>
    </div>
  );

  // ─── Timeframe selector ─────────────────────────────────────────────────────
  const tfSelector = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TIMEFRAMES.map((tf) => {
        const active = tf === timeframe;
        return (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              active
                ? "tab-active bg-ink-800 border-brand-400 text-ink-100"
                : "border-white/10 text-ink-400 hover:bg-white/5 hover:text-ink-200"
            }`}
          >
            {tf}
          </button>
        );
      })}
    </div>
  );

  // ─── Chart ──────────────────────────────────────────────────────────────────
  const chart = (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-ink-100">Price Chart - {timeframe}</div>
        <div className="text-xs text-ink-500">{candles.length} points</div>
      </div>
      <PriceChart candles={candles} positive={positive} />
    </div>
  );

  // ─── Tab bar ─────────────────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {TABS.map((t) => {
        const active = t.id === tab;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-1.5 whitespace-nowrap ${
              active
                ? "tab-active bg-ink-800 border-brand-400 text-ink-100"
                : "border-white/10 text-ink-400 hover:bg-white/5 hover:text-ink-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );

  // ─── Tab content ─────────────────────────────────────────────────────────────

  // Overview tab
  const overviewTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={Activity} title="Technical Score" />
          {tech ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-3xl font-mono font-bold ${scoreColor(tech.score + 50)}`}>
                  {tech.score}
                </span>
                <span className="chip bg-ink-800 text-ink-300">{tech.verdict}</span>
              </div>
              <ScoreBar score={tech.score + 50} />
              <div className="text-xs text-ink-500 mt-2">{tech.trend} trend - RSI {tech.rsi}</div>
            </>
          ) : (
            <div className="text-sm text-ink-500">Insufficient data for technical analysis.</div>
          )}
        </div>
        <div className="card p-4">
          <SectionTitle icon={Scale} title="Fundamental Score" />
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-mono font-bold ${gradeColor(fundScore.grade)}`}>
              {fundScore.grade}
            </span>
            <span className="chip bg-ink-800 text-ink-300">{fundScore.score}/100</span>
          </div>
          <ScoreBar score={fundScore.score} />
          <div className="text-xs text-ink-500 mt-2">
            P/E {fmtNum(fund.pe, 1)} - ROE {fmtNum(fund.roe, 1)}% - D/E {fmtNum(fund.debtToEquity, 2)}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Target} title="Recommendation Summary" />
        {rec ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`chip border ${actionBg(rec.action)} text-base font-semibold px-3 py-1`}>
                {rec.action}
              </span>
              <span className="text-sm text-ink-400">
                Confidence {Math.round(rec.confidence * 100)}% - Horizon {rec.horizon}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatTile label="Composite" value={fmtNum(rec.score, 0)} />
              <StatTile label="Technical" value={fmtNum(rec.technicalScore, 0)} />
              <StatTile label="Fundamental" value={fmtNum(rec.fundamentalScore, 0)} />
              <StatTile label="Forecast" value={fmtNum(rec.forecastScore, 0)} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rec.signals.map((s, i) => (
                <span key={i} className="chip bg-ink-800 text-ink-300">{s}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-ink-500">No recommendation available.</div>
        )}
      </div>

      <div className="card p-4">
        <SectionTitle icon={LineChart} title="Forecast Summary" />
        {fc ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-semibold ${actionColor(fc.consensus)}`}>{fc.consensus}</span>
              <span className="text-sm text-ink-400">
                Consensus {positive ? "+" : ""}{fmtNum(fc.consensusScore, 1)}% expected return
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StatTile label="Bull Target" value={formatPrice(fc.bull.targetPrice, meta.currency)} sub={`${positive ? "+" : ""}${fmtNum(fc.bull.expectedReturnPct, 1)}%`} />
              <StatTile label="Base Target" value={formatPrice(fc.base.targetPrice, meta.currency)} sub={`${positive ? "+" : ""}${fmtNum(fc.base.expectedReturnPct, 1)}%`} />
              <StatTile label="Bear Target" value={formatPrice(fc.bear.targetPrice, meta.currency)} sub={`${fmtNum(fc.bear.expectedReturnPct, 1)}%`} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-ink-500">
              <span>Trend: {fc.trendDirection}</span>
              <span>Momentum: {fc.momentum}</span>
              <span>Volatility: {fc.volatility}</span>
              <span>Risk: {fc.riskLevel}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-ink-500">No forecast available.</div>
        )}
      </div>
    </div>
  );

  // AI Analysis tab
  const aiTab = ai ? (
    <div className="space-y-4">
      <div className="card p-4">
        <SectionTitle icon={Brain} title="AI Summary" />
        <p className="text-sm text-ink-300 leading-relaxed">{ai.summary}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`chip border ${actionBg(ai.sentiment)}`}>{ai.sentiment}</span>
          <span className="chip bg-ink-800 text-ink-300">Sentiment {ai.sentimentScore}</span>
          <span className="chip bg-ink-800 text-ink-300">Confidence {Math.round(ai.confidence * 100)}%</span>
          <span className="chip bg-ink-800 text-ink-300">Horizon {ai.timeHorizon}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={TrendingUp} title="Bull Case" />
          <ListBlock items={ai.bullCase} tone="bull" />
        </div>
        <div className="card p-4">
          <SectionTitle icon={TrendingDown} title="Bear Case" />
          <ListBlock items={ai.bearCase} tone="bear" />
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={AlertTriangle} title="Key Risks" />
        <ListBlock items={ai.keyRisks} tone="risk" />
      </div>

      <div className="card p-4">
        <SectionTitle icon={CheckCircle2} title="Action Items" />
        <ListBlock items={ai.actionItems} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={Layers} title="Pattern Recognition" />
          <ListBlock items={ai.patternRecognition} />
        </div>
        <div className="card p-4">
          <SectionTitle icon={Zap} title="Catalysts" />
          <ListBlock items={ai.catalysts} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={ShieldCheck} title="ESG Score" />
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-mono font-bold ${scoreColor(ai.esgScore)}`}>{ai.esgScore}</span>
            <span className="text-xs text-ink-500">/ 100</span>
          </div>
          <ScoreBar score={ai.esgScore} />
        </div>
        <div className="card p-4">
          <SectionTitle icon={Activity} title="Options Flow" />
          <p className="text-sm text-ink-300">{ai.optionsFlow}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={Building2} title="Insider Activity" />
          <p className="text-sm text-ink-300">{ai.insiderActivity}</p>
        </div>
        <div className="card p-4">
          <SectionTitle icon={DollarSign} title="Earnings Estimate" />
          <p className="text-sm text-ink-300">{ai.earningsEstimate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={Target} title="Analyst Consensus" />
          <p className="text-sm text-ink-300">{ai.analystConsensus}</p>
        </div>
        <div className="card p-4">
          <SectionTitle icon={Wallet} title="Smart Money" />
          <p className="text-sm text-ink-300">{ai.smartMoney}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="card p-8 text-center text-ink-500 text-sm">AI analysis unavailable - insufficient data.</div>
  );

  // Recommendation tab
  const recTab = rec ? (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className={`chip border ${actionBg(rec.action)} text-lg font-semibold px-4 py-1.5`}>
            {rec.action}
          </span>
          <div className="text-sm text-ink-400">
            Composite score <span className="font-mono text-ink-200">{rec.score}</span> - Confidence{" "}
            <span className="font-mono text-ink-200">{Math.round(rec.confidence * 100)}%</span> - Horizon{" "}
            {rec.horizon}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3">
            <div className="text-xs text-ink-500 mb-1">Technical</div>
            <div className={`text-lg font-mono ${scoreColor(rec.technicalScore + 50)}`}>{rec.technicalScore}</div>
            <ScoreBar score={rec.technicalScore + 50} />
          </div>
          <div className="card p-3">
            <div className="text-xs text-ink-500 mb-1">Fundamental</div>
            <div className={`text-lg font-mono ${scoreColor(rec.fundamentalScore)}`}>{rec.fundamentalScore}</div>
            <ScoreBar score={rec.fundamentalScore} />
          </div>
          <div className="card p-3">
            <div className="text-xs text-ink-500 mb-1">Forecast</div>
            <div className={`text-lg font-mono ${scoreColor(rec.forecastScore + 50)}`}>{rec.forecastScore}</div>
            <ScoreBar score={rec.forecastScore + 50} />
          </div>
          <div className="card p-3">
            <div className="text-xs text-ink-500 mb-1">Risk</div>
            <div className={`text-lg font-mono ${scoreColor(rec.riskScore)}`}>{rec.riskScore}</div>
            <ScoreBar score={rec.riskScore} />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Sparkles} title="Signals" />
        <div className="flex flex-wrap gap-1.5">
          {rec.signals.map((s, i) => (
            <span key={i} className="chip bg-ink-800 text-ink-300">{s}</span>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Lightbulb} title="Rationale" />
        <ListBlock items={rec.rationale} />
      </div>
    </div>
  ) : (
    <div className="card p-8 text-center text-ink-500 text-sm">No recommendation available.</div>
  );

  // Technicals tab
  const techTab = tech ? (
    <div className="space-y-4">
      <div className="card p-4">
        <SectionTitle icon={Activity} title="Indicator Matrix" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <StatTile label="RSI (14)" value={fmtNum(tech.rsi, 1)} sub={tech.rsiSignal} />
          <StatTile label="MACD" value={fmtNum(tech.macd, 3)} sub={`Sig ${fmtNum(tech.macdSignal, 3)}`} />
          <StatTile label="MACD Hist" value={fmtNum(tech.macdHist, 3)} sub={tech.macdTrend} />
          <StatTile label="ADX" value={fmtNum(tech.adx, 1)} sub={tech.adxTrend} />
          <StatTile label="Stoch %K" value={fmtNum(tech.stochK, 1)} sub={`%D ${fmtNum(tech.stochD, 1)}`} />
          <StatTile label="CCI (20)" value={fmtNum(tech.cci, 1)} />
          <StatTile label="Williams %R" value={fmtNum(tech.williamsR, 1)} />
          <StatTile label="MFI (14)" value={fmtNum(tech.mfi, 1)} />
          <StatTile label="ATR" value={fmtNum(tech.atr, 2)} sub={`${fmtNum(tech.atrPct, 2)}%`} />
          <StatTile label="VWAP" value={formatPrice(tech.vwap, meta.currency)} />
          <StatTile label="OBV" value={fmtCompact(tech.obv)} sub={tech.obvTrend} />
          <StatTile label="Verdict" value={tech.verdict} sub={tech.trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={LineChart} title="Moving Averages" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-400">Price</span>
              <span className="font-mono text-ink-100">{formatPrice(price, meta.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">SMA 50</span>
              <span className={`font-mono ${tech.aboveSma50 ? "text-bull" : "text-bear"}`}>
                {formatPrice(tech.sma50, meta.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">SMA 200</span>
              <span className={`font-mono ${tech.aboveSma200 ? "text-bull" : "text-bear"}`}>
                {formatPrice(tech.sma200, meta.currency)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`chip ${tech.aboveSma50 ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
                {tech.aboveSma50 ? "Above SMA50" : "Below SMA50"}
              </span>
              <span className={`chip ${tech.aboveSma200 ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
                {tech.aboveSma200 ? "Above SMA200" : "Below SMA200"}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <SectionTitle icon={Layers} title="Bollinger Bands" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-400">Upper</span>
              <span className="font-mono text-ink-100">{formatPrice(tech.bbUpper, meta.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Middle</span>
              <span className="font-mono text-ink-100">{formatPrice(tech.bbMiddle, meta.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Lower</span>
              <span className="font-mono text-ink-100">{formatPrice(tech.bbLower, meta.currency)}</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-ink-500 mb-1">
                <span>Position</span>
                <span>{fmtNum(tech.bbPosition, 1)}%</span>
              </div>
              <ScoreBar score={tech.bbPosition} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={TrendingDown} title="Support Levels" />
          <div className="space-y-2">
            {tech.supports.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink-400">S{i + 1}</span>
                <span className="font-mono text-bull">{formatPrice(s, meta.currency)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <SectionTitle icon={TrendingUp} title="Resistance Levels" />
          <div className="space-y-2">
            {tech.resistances.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink-400">R{i + 1}</span>
                <span className="font-mono text-bear">{formatPrice(r, meta.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="card p-8 text-center text-ink-500 text-sm">Insufficient data for technical analysis.</div>
  );

  // Fundamentals tab
  const fundTab = (
    <div className="space-y-4">
      <div className="card p-4">
        <SectionTitle icon={Scale} title="Score Breakdown" />
        <div className="flex items-baseline gap-3 mb-4">
          <span className={`text-4xl font-mono font-bold ${gradeColor(fundScore.grade)}`}>{fundScore.grade}</span>
          <span className="text-sm text-ink-400">Overall {fundScore.score}/100</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {([
            { label: "Valuation", val: fundScore.valuation },
            { label: "Profitability", val: fundScore.profitability },
            { label: "Growth", val: fundScore.growth },
            { label: "Financial Health", val: fundScore.financialHealth },
            { label: "Cash Flow", val: fundScore.cashFlow },
          ] as const).map((s) => (
            <div key={s.label} className="card p-3">
              <div className="text-xs text-ink-500 mb-1">{s.label}</div>
              <div className={`text-lg font-mono ${scoreColor(s.val)}`}>{s.val}</div>
              <ScoreBar score={s.val} />
            </div>
          ))}
        </div>
        {fundScore.notes.length > 0 ? (
          <div className="mt-4">
            <div className="text-xs text-ink-500 mb-1">Notes</div>
            <ListBlock items={fundScore.notes} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle icon={DollarSign} title="Valuation Ratios" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-400">P/E</span><span className="font-mono text-ink-100">{fmtNum(fund.pe, 1)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Forward P/E</span><span className="font-mono text-ink-100">{fmtNum(fund.forwardPe, 1)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">PEG</span><span className="font-mono text-ink-100">{fmtNum(fund.peg, 2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">P/S</span><span className="font-mono text-ink-100">{fmtNum(fund.ps, 2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">P/B</span><span className="font-mono text-ink-100">{fmtNum(fund.pb, 2)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">EV/EBITDA</span><span className="font-mono text-ink-100">{fmtNum(fund.evEbitda, 1)}</span></div>
          </div>
        </div>

        <div className="card p-4">
          <SectionTitle icon={TrendingUp} title="Profitability" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-400">ROE</span><span className="font-mono text-ink-100">{fmtNum(fund.roe, 1)}%</span></div>
            <div className="flex justify-between"><span className="text-ink-400">ROA</span><span className="font-mono text-ink-100">{fmtNum(fund.roa, 1)}%</span></div>
            <div className="flex justify-between"><span className="text-ink-400">ROIC</span><span className="font-mono text-ink-100">{fmtNum(fund.roic, 1)}%</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Gross Margin</span><span className="font-mono text-ink-100">{fmtPct(fund.grossMargin)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Operating Margin</span><span className="font-mono text-ink-100">{fmtPct(fund.operatingMargin)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Net Margin</span><span className="font-mono text-ink-100">{fmtPct(fund.netMargin)}</span></div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={ShieldCheck} title="Financial Health" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Debt / Equity" value={fmtNum(fund.debtToEquity, 2)} />
          <StatTile label="Current Ratio" value={fmtNum(fund.currentRatio, 2)} />
          <StatTile label="Quick Ratio" value={fmtNum(fund.quickRatio, 2)} />
          <StatTile label="FCF Yield" value={`${fmtNum(fund.fcfYield, 2)}%`} />
          <StatTile label="Revenue Growth" value={`${fmtNum(fund.revenueGrowth, 1)}%`} />
          <StatTile label="Earnings Growth" value={`${fmtNum(fund.earningsGrowth, 1)}%`} />
          <StatTile label="Payout Ratio" value={fmtPct(fund.payoutRatio)} />
          <StatTile label="Dividend Yield" value={`${fmtNum(fund.dividendYield, 2)}%`} />
        </div>
      </div>
    </div>
  );

  // Financials tab
  function FinTable({ title, rows, cols }: { title: string; rows: Record<string, number>[]; cols: { key: string; label: string; fmt: (n: number) => string }[] }) {
    return (
      <div className="card p-4">
        <SectionTitle icon={BarChart3} title={title} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-500 border-b border-white/5">
                <th className="text-left py-2 px-2 font-medium">Period</th>
                {cols.map((c) => (
                  <th key={c.key} className="text-right py-2 px-2 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-2 px-2 text-ink-400 font-mono">{r.period}</td>
                  {cols.map((c) => (
                    <td key={c.key} className="py-2 px-2 text-right font-mono text-ink-200">
                      {c.fmt(r[c.key] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const finTab = (
    <div className="space-y-4">
      <FinTable
        title="Income Statements"
        rows={income as unknown as Record<string, number>[]}
        cols={[
          { key: "revenue", label: "Revenue", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "grossProfit", label: "Gross", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "operatingIncome", label: "Op Inc", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "netIncome", label: "Net Inc", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "ebitda", label: "EBITDA", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "eps", label: "EPS", fmt: (n) => fmtNum(n, 2) },
        ]}
      />
      <FinTable
        title="Balance Sheets"
        rows={balance as unknown as Record<string, number>[]}
        cols={[
          { key: "totalAssets", label: "Assets", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "totalLiabilities", label: "Liab", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "equity", label: "Equity", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "cash", label: "Cash", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "debt", label: "Debt", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "inventory", label: "Inv", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "receivables", label: "Recv", fmt: (n) => formatCompact(n, meta.currency) },
        ]}
      />
      <FinTable
        title="Cash Flows"
        rows={cashflow as unknown as Record<string, number>[]}
        cols={[
          { key: "operatingCf", label: "Op CF", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "capex", label: "CapEx", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "freeCf", label: "Free CF", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "dividends", label: "Div", fmt: (n) => formatCompact(n, meta.currency) },
          { key: "netDebtIssuance", label: "Net Debt", fmt: (n) => formatCompact(n, meta.currency) },
        ]}
      />
    </div>
  );

  // Forecast tab
  const forecastTab = fc ? (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border-bull/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-bull" />
            <span className="text-sm font-semibold text-bull">Bull Scenario</span>
          </div>
          <div className="text-2xl font-mono text-ink-100">{formatPrice(fc.bull.targetPrice, meta.currency)}</div>
          <div className="text-sm text-bull font-mono">{positive ? "+" : ""}{fmtNum(fc.bull.expectedReturnPct, 1)}%</div>
          <div className="text-xs text-ink-500 mt-2">Confidence {Math.round(fc.bull.confidence * 100)}%</div>
          <div className="text-xs text-ink-500 mt-1">{fc.bull.method}</div>
        </div>
        <div className="card p-4 border-accent-400/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-semibold text-accent-400">Base Scenario</span>
          </div>
          <div className="text-2xl font-mono text-ink-100">{formatPrice(fc.base.targetPrice, meta.currency)}</div>
          <div className="text-sm text-accent-400 font-mono">{positive ? "+" : ""}{fmtNum(fc.base.expectedReturnPct, 1)}%</div>
          <div className="text-xs text-ink-500 mt-2">Confidence {Math.round(fc.base.confidence * 100)}%</div>
          <div className="text-xs text-ink-500 mt-1">{fc.base.method}</div>
        </div>
        <div className="card p-4 border-bear/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-bear" />
            <span className="text-sm font-semibold text-bear">Bear Scenario</span>
          </div>
          <div className="text-2xl font-mono text-ink-100">{formatPrice(fc.bear.targetPrice, meta.currency)}</div>
          <div className="text-sm text-bear font-mono">{fmtNum(fc.bear.expectedReturnPct, 1)}%</div>
          <div className="text-xs text-ink-500 mt-2">Confidence {Math.round(fc.bear.confidence * 100)}%</div>
          <div className="text-xs text-ink-500 mt-1">{fc.bear.method}</div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Gauge} title="Forecast Metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatTile label="Consensus" value={fc.consensus} />
          <StatTile label="Consensus Score" value={`${fmtNum(fc.consensusScore, 1)}%`} />
          <StatTile label="Trend" value={fc.trendDirection} />
          <StatTile label="Momentum" value={fc.momentum} />
          <StatTile label="Volatility" value={fc.volatility} />
          <StatTile label="Risk Level" value={fc.riskLevel} />
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Lightbulb} title="Notes" />
        <ListBlock items={fc.notes} />
      </div>
    </div>
  ) : (
    <div className="card p-8 text-center text-ink-500 text-sm">No forecast available.</div>
  );

  // Ownership tab (synthesized from signals - deterministic)
  const ownershipTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <SectionTitle icon={Building2} title="Institutional" />
          <div className="text-2xl font-mono text-ink-100 mb-1">
            {tech && tech.obvTrend === "Rising" ? "Accumulating" : tech && tech.obvTrend === "Falling" ? "Distributing" : "Neutral"}
          </div>
          <p className="text-xs text-ink-500">
            {tech ? `OBV trend ${tech.obvTrend.toLowerCase()} suggests ${tech.obvTrend === "Rising" ? "institutional buying" : tech.obvTrend === "Falling" ? "institutional selling" : "balanced flow"}.` : "No flow data."}
          </p>
        </div>
        <div className="card p-4">
          <SectionTitle icon={Users} title="Retail" />
          <div className="text-2xl font-mono text-ink-100 mb-1">
            {quote && quote.volume > quote.avgVolume ? "Above Avg" : "Normal"}
          </div>
          <p className="text-xs text-ink-500">
            {quote ? `Volume ${fmtCompact(quote.volume)} vs avg ${fmtCompact(quote.avgVolume)}.` : "No volume data."}
          </p>
        </div>
        <div className="card p-4">
          <SectionTitle icon={Wallet} title="Insider" />
          <div className="text-2xl font-mono text-ink-100 mb-1">
            {ai ? (ai.insiderActivity.includes("Accumulation") ? "Buying" : ai.insiderActivity.includes("Distribution") ? "Selling" : "Quiet") : "N/A"}
          </div>
          <p className="text-xs text-ink-500">{ai ? ai.insiderActivity : "No insider data."}</p>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Activity} title="Smart Money Positioning" />
        <p className="text-sm text-ink-300">{ai ? ai.smartMoney : "No smart money data."}</p>
      </div>

      <div className="card p-4">
        <SectionTitle icon={Layers} title="Options Flow" />
        <p className="text-sm text-ink-300">{ai ? ai.optionsFlow : "No options flow data."}</p>
      </div>
    </div>
  );

  const tabContent: Record<TabId, React.ReactNode> = {
    overview: overviewTab,
    ai: aiTab,
    recommendation: recTab,
    technicals: techTab,
    fundamentals: fundTab,
    financials: finTab,
    forecast: forecastTab,
    ownership: ownershipTab,
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {header}
      {priceBar}
      {tfSelector}
      {chart}
      {tabBar}
      {tabContent[tab]}
    </div>
  );
}
