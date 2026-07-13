import { useMemo, useState } from 'react';
import { Star, ArrowLeft, Plus, Minus, Target, TrendingUp, TrendingDown, Shield, Activity, Gauge, Brain, AlertTriangle, Lightbulb, Zap, Eye, BarChart3, Leaf, Users, Building2, FileText } from 'lucide-react';
import { getMeta, getCandles, getFundamentals, getIncomeStatements, getBalanceSheets, getCashFlows } from '../lib/dataService';
import { useLiveQuote } from '../lib/liveFeed';
import { analyzeTechnicals } from '../lib/indicators';
import { scoreFundamentals } from '../lib/fundamentalScore';
import { forecast, recommend } from '../lib/forecast';
import { generateAIAnalysis } from '../lib/aiAnalysis';
import { useCurrency } from '../lib/currency';
import { fmtCompact, fmtPct, fmtPctRaw, fmtNum } from '../lib/format';
import { PriceChart } from '../components/PriceChart';
import type { Timeframe } from '../lib/types';

interface Props {
  symbol: string;
  onBack: () => void;
  onOpenStock: (s: string) => void;
  watched: boolean;
  onToggleWatch: (s: string) => void;
  onAddHolding: (s: string) => void;
}

type Tab = 'overview' | 'ai' | 'recommendation' | 'technicals' | 'fundamentals' | 'financials' | 'forecast' | 'ownership';

export function StockDetail({ symbol, onBack, watched, onToggleWatch, onAddHolding }: Props) {
  const meta = getMeta(symbol);
  const quote = useLiveQuote(symbol);
  const [tf, setTf] = useState<Timeframe>('1Y');
  const [tab, setTab] = useState<Tab>('overview');
  const candles = useMemo(() => getCandles(symbol, tf), [symbol, tf]);
  const tech = useMemo(() => (candles.length ? analyzeTechnicals(candles) : null), [candles]);
  const fund = useMemo(() => getFundamentals(symbol), [symbol]);
  const fundScore = useMemo(() => (fund ? scoreFundamentals(fund) : null), [fund]);
  const income = useMemo(() => getIncomeStatements(symbol), [symbol]);
  const balance = useMemo(() => getBalanceSheets(symbol), [symbol]);
  const cashflow = useMemo(() => getCashFlows(symbol), [symbol]);
  const forecastSet = useMemo(() => (candles.length && fund ? forecast(candles, fund, tech) : null), [candles, fund, tech]);
  const recommendation = useMemo(() => (tech ? recommend(tech, fundScore?.score ?? 50, forecastSet, fund) : null), [tech, fundScore, forecastSet, fund]);
  const aiAnalysis = useMemo(() => (candles.length ? generateAIAnalysis(symbol, candles, fund, tech, forecastSet, recommendation) : null), [symbol, candles, fund, tech, forecastSet, recommendation]);
  const { formatPrice, formatCompact } = useCurrency();

  if (!meta || !quote) {
    return <div className="card p-8 text-center text-ink-400">Stock "{symbol}" not found in universe.</div>;
  }

  const up = quote.change >= 0;
  const verdictColor =
    tech?.verdict === 'Strong Buy' ? 'text-bull' :
    tech?.verdict === 'Buy' ? 'text-bull' :
    tech?.verdict === 'Strong Sell' ? 'text-bear' :
    tech?.verdict === 'Sell' ? 'text-bear' : 'text-ink-300';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={onBack} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Back</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-ink-50">{meta.symbol}</h1>
            <span className="chip bg-white/5 text-ink-300">{meta.exchange}</span>
            <span className="chip bg-white/5 text-ink-400">{meta.region}</span>
            <span className="chip bg-brand-500/10 text-brand-300">{meta.sector}</span>
          </div>
          <p className="text-ink-400 text-sm mt-1">{meta.name} · {meta.industry}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onAddHolding(symbol)} className="btn-outline"><Plus size={15} /> Add to portfolio</button>
          <button onClick={() => onToggleWatch(symbol)} className={watched ? 'btn-primary' : 'btn-outline'}>
            <Star size={15} className={watched ? 'fill-ink-950' : ''} /> {watched ? 'Watching' : 'Watch'}
          </button>
        </div>
      </div>

      {/* Price banner */}
      <div className="card p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <div className="text-3xl font-bold font-mono text-ink-50">{formatPrice(quote.price, meta.currency)}</div>
            <div className={`text-sm font-mono mt-1 flex items-center gap-1 ${up ? 'text-bull' : 'text-bear'}`}>
              {up ? <Plus size={14} /> : <Minus size={14} />}
              {up ? '+' : ''}{fmtNum(quote.change)} ({up ? '+' : ''}{fmtPctRaw(quote.changePct)})
              <span className="text-ink-500 ml-2">Today</span>
            </div>
          </div>
          <div className="ml-auto grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
            <KV label="Prev close" value={formatPrice(quote.prevClose, meta.currency)} />
            <KV label="Day range" value={`${fmtNum(quote.dayLow)} – ${fmtNum(quote.dayHigh)}`} />
            <KV label="52w range" value={`${fmtNum(quote.yearLow)} – ${fmtNum(quote.yearHigh)}`} />
            <KV label="Volume" value={fmtCompact(quote.volume)} />
            <KV label="Mkt cap" value={`$${fmtCompact(quote.marketCap)}`} />
            <KV label="P/E" value={fmtNum(quote.pe)} />
            <KV label="EPS" value={fmtNum(quote.eps)} />
            <KV label="Beta" value={fmtNum(quote.beta)} />
          </div>
        </div>
      </div>

      {/* Verdict strip */}
      {tech && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="text-xs text-ink-500">Recommendation</div>
            <div className={`text-lg font-bold ${recommendation ? (recommendation.action.includes('Buy') ? 'text-bull' : recommendation.action.includes('Sell') ? 'text-bear' : 'text-accent-400') : 'text-ink-300'}`}>{recommendation?.action ?? '—'}</div>
            <div className="text-xs text-ink-500">{recommendation ? `${recommendation.score}/100 · ${recommendation.confidence}% conf` : 'n/a'}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-ink-500">Technical verdict</div>
            <div className={`text-lg font-bold ${verdictColor}`}>{tech.verdict}</div>
            <div className="text-xs text-ink-500">Score {tech.score}/100</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-ink-500">Forecast (1Y base)</div>
            <div className="text-lg font-semibold text-ink-100">{forecastSet ? fmtNum(forecastSet.base.targetPrice) : '—'}</div>
            <div className={`text-xs ${forecastSet && forecastSet.base.expectedReturnPct >= 0 ? 'text-bull' : 'text-bear'}`}>{forecastSet ? `${forecastSet.base.expectedReturnPct >= 0 ? '+' : ''}${forecastSet.base.expectedReturnPct}%` : 'n/a'}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-ink-500">Fundamental grade</div>
            <div className={`text-lg font-bold ${fundScore ? (fundScore.grade.startsWith('A') ? 'text-bull' : fundScore.grade === 'F' ? 'text-bear' : 'text-ink-100') : 'text-ink-500'}`}>{fundScore?.grade ?? '—'}</div>
            <div className="text-xs text-ink-500">{fundScore ? `${fundScore.score}/100` : 'n/a'}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card p-5">
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tf === t ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:bg-white/5'}`}
            >{t}</button>
          ))}
        </div>
        <PriceChart candles={candles} currency={meta.currency} timeframe={tf} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto no-scrollbar">
        {(['overview', 'ai', 'recommendation', 'technicals', 'fundamentals', 'financials', 'forecast', 'ownership'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition whitespace-nowrap ${tab === t ? 'tab-active' : 'border-transparent text-ink-400 hover:text-ink-200'}`}
          >{t}</button>
        ))}
      </div>

      {tab === 'overview' && tech && fund && fundScore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Technical snapshot</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <KV label="RSI (14)" value={fmtNum(tech.rsi)} />
              <KV label="MACD" value={fmtNum(tech.macd, 4)} />
              <KV label="MACD signal" value={fmtNum(tech.macdSignal, 4)} />
              <KV label="MACD trend" value={tech.macdTrend} />
              <KV label="SMA 20" value={fmtNum(tech.sma20)} />
              <KV label="SMA 50" value={fmtNum(tech.sma50)} />
              <KV label="SMA 200" value={fmtNum(tech.sma200)} />
              <KV label="ATR (14)" value={fmtNum(tech.atr)} />
              <KV label="Stoch %K" value={fmtNum(tech.stochK)} />
              <KV label="Stoch %D" value={fmtNum(tech.stochD)} />
              <KV label="VWAP" value={fmtNum(tech.vwap)} />
              <KV label="ADX" value={fmtNum(tech.adx)} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-xs text-ink-500 mb-2">Key levels</div>
              <div className="flex flex-wrap gap-2">
                {tech.resistances.map((r, i) => (
                  <span key={i} className="chip bg-bear/10 text-bear">R {fmtNum(r)}</span>
                ))}
                {tech.supports.map((s, i) => (
                  <span key={i} className="chip bg-bull/10 text-bull">S {fmtNum(s)}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Fundamental snapshot</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <KV label="P/E (ttm)" value={fmtNum(fund.pe)} />
              <KV label="Fwd P/E" value={fmtNum(fund.forwardPe)} />
              <KV label="PEG" value={fmtNum(fund.peg)} />
              <KV label="P/S" value={fmtNum(fund.ps)} />
              <KV label="P/B" value={fmtNum(fund.pb)} />
              <KV label="EV/EBITDA" value={fmtNum(fund.evEbitda)} />
              <KV label="ROE" value={fmtPct(fund.roe)} />
              <KV label="ROA" value={fmtPct(fund.roa)} />
              <KV label="Net margin" value={fmtPct(fund.netMargin)} />
              <KV label="D/E" value={fmtNum(fund.debtToEquity)} />
              <KV label="Rev growth" value={fmtPct(fund.revenueGrowth)} />
              <KV label="Div yield" value={fmtPct(fund.dividendYield)} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-xs text-ink-500 mb-1">Analyst-style verdict</div>
              <p className="text-sm text-ink-200">{fundScore.verdict}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'ai' && aiAnalysis && (
        <div className="space-y-4 animate-fade-in">
          {/* AI Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100">AI Analysis Summary</h3>
              <span className={`chip ml-auto ${aiAnalysis.sentiment.includes('Bullish') ? 'bg-bull/15 text-bull' : aiAnalysis.sentiment.includes('Bearish') ? 'bg-bear/15 text-bear' : 'bg-accent-400/15 text-accent-400'}`}>
                {aiAnalysis.sentiment}
              </span>
            </div>
            <p className="text-sm text-ink-300 leading-relaxed">{aiAnalysis.summary}</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="text-xs text-ink-500">Sentiment Score</div>
                <div className={`text-lg font-bold font-mono ${aiAnalysis.sentimentScore >= 0 ? 'text-bull' : 'text-bear'}`}>{aiAnalysis.sentimentScore >= 0 ? '+' : ''}{aiAnalysis.sentimentScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-ink-500">Confidence</div>
                <div className="text-lg font-bold font-mono text-ink-100">{aiAnalysis.confidence}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-ink-500">Time Horizon</div>
                <div className="text-lg font-bold text-ink-100">{aiAnalysis.timeHorizon}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bull case */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-bull" />
                <h3 className="font-semibold text-ink-100">Bull Case</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.bullCase.map((b, i) => (
                  <li key={i} className="text-sm text-ink-300 flex items-start gap-2">
                    <span className="text-bull mt-0.5">+</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bear case */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-bear" />
                <h3 className="font-semibold text-ink-100">Bear Case</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.bearCase.map((b, i) => (
                  <li key={i} className="text-sm text-ink-300 flex items-start gap-2">
                    <span className="text-bear mt-0.5">−</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Key risks */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-accent-400" />
                <h3 className="font-semibold text-ink-100">Key Risks</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.keyRisks.map((r, i) => (
                  <li key={i} className="text-sm text-ink-300 flex items-start gap-2">
                    <span className="text-accent-400 mt-0.5">!</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action items */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-brand-400" />
                <h3 className="font-semibold text-ink-100">Action Items</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.actionItems.map((a, i) => (
                  <li key={i} className="text-sm text-ink-300 flex items-start gap-2">
                    <span className="text-brand-400 mt-0.5">→</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pattern recognition */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-brand-300" />
              <h3 className="font-semibold text-ink-100">Pattern Recognition</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {aiAnalysis.patternRecognition.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <div>
                    <div className="text-sm text-ink-200">{p.pattern}</div>
                    <div className="text-xs text-ink-500">Confidence {p.confidence}%</div>
                  </div>
                  <span className={`chip ${p.signal === 'Bullish' ? 'bg-bull/15 text-bull' : p.signal === 'Bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{p.signal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Catalysts */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent-400" />
              <h3 className="font-semibold text-ink-100">Upcoming Catalysts</h3>
            </div>
            <div className="space-y-2">
              {aiAnalysis.catalysts.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <div className="text-sm text-ink-200">{c.event}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-500">{c.timing}</span>
                    <span className={`chip ${c.impact === 'High' ? 'bg-accent-400/15 text-accent-400' : c.impact === 'Medium' ? 'bg-brand-500/15 text-brand-300' : 'bg-white/5 text-ink-400'}`}>{c.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ESG */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={16} className="text-bull" />
                <h3 className="font-semibold text-ink-100">ESG Score</h3>
                <span className="chip ml-auto bg-white/5 text-ink-300">Grade {aiAnalysis.esgScore.grade}</span>
              </div>
              <div className="space-y-3">
                <ESGBar label="Environmental" value={aiAnalysis.esgScore.environmental} />
                <ESGBar label="Social" value={aiAnalysis.esgScore.social} />
                <ESGBar label="Governance" value={aiAnalysis.esgScore.governance} />
              </div>
            </div>

            {/* Options flow */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-brand-300" />
                <h3 className="font-semibold text-ink-100">Options Flow</h3>
                <span className={`chip ml-auto ${aiAnalysis.optionsFlow.sentiment === 'Bullish' ? 'bg-bull/15 text-bull' : aiAnalysis.optionsFlow.sentiment === 'Bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{aiAnalysis.optionsFlow.sentiment}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-ink-500">Call Volume</div><div className="font-mono text-bull">{aiAnalysis.optionsFlow.callVolume.toLocaleString()}</div></div>
                <div><div className="text-xs text-ink-500">Put Volume</div><div className="font-mono text-bear">{aiAnalysis.optionsFlow.putVolume.toLocaleString()}</div></div>
                <div><div className="text-xs text-ink-500">Put/Call Ratio</div><div className="font-mono text-ink-100">{aiAnalysis.optionsFlow.putCallRatio}</div></div>
                <div><div className="text-xs text-ink-500">Smart Money</div><div className="font-mono text-ink-100">{aiAnalysis.smartMoney.institutional}% inst</div></div>
              </div>
            </div>

            {/* Insider activity */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-accent-400" />
                <h3 className="font-semibold text-ink-100">Insider Activity</h3>
                <span className={`chip ml-auto ${aiAnalysis.insiderActivity.sentiment === 'Positive' ? 'bg-bull/15 text-bull' : aiAnalysis.insiderActivity.sentiment === 'Negative' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{aiAnalysis.insiderActivity.sentiment}</span>
              </div>
              <div className="text-sm text-ink-300">
                <div className="font-medium text-ink-100">{aiAnalysis.insiderActivity.type}</div>
                <div className="text-ink-400 mt-1">{aiAnalysis.insiderActivity.detail}</div>
              </div>
            </div>

            {/* Earnings estimate */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-brand-300" />
                <h3 className="font-semibold text-ink-100">Earnings Estimate</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-ink-500">Next Report</div><div className="text-ink-100">{aiAnalysis.earningsEstimate.nextDate}</div></div>
                <div><div className="text-xs text-ink-500">EPS Estimate</div><div className="font-mono text-ink-100">{fmtNum(aiAnalysis.earningsEstimate.epsEstimate)}</div></div>
                <div><div className="text-xs text-ink-500">Revenue Est.</div><div className="font-mono text-ink-100">{formatCompact(aiAnalysis.earningsEstimate.revenueEstimate, meta?.currency ?? 'USD')}</div></div>
                <div><div className="text-xs text-ink-500">Surprise</div><div className={`font-mono ${aiAnalysis.earningsEstimate.surprisePct >= 0 ? 'text-bull' : 'text-bear'}`}>{aiAnalysis.earningsEstimate.surprisePct >= 0 ? '+' : ''}{aiAnalysis.earningsEstimate.surprisePct}%</div></div>
              </div>
            </div>
          </div>

          {/* Analyst consensus */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100">Analyst Consensus</h3>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-ink-500">Rating</div>
                <div className="text-lg font-bold text-ink-100">{aiAnalysis.analystConsensus.rating}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Target Price</div>
                <div className="text-lg font-bold font-mono text-brand-300">{formatPrice(aiAnalysis.analystConsensus.targetPrice, meta?.currency ?? 'USD')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Analysts</div>
                <div className="text-lg font-bold text-ink-100">{aiAnalysis.analystConsensus.count}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'ai' && !aiAnalysis && (
        <div className="card p-8 text-center text-ink-500 text-sm">AI analysis requires price data. Loading…</div>
      )}

      {tab === 'technicals' && tech && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-4">Indicator matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <IndicatorCard name="RSI (14)" value={fmtNum(tech.rsi)} signal={tech.rsiSignal} good={tech.rsi < 70 && tech.rsi > 30} />
              <IndicatorCard name="MACD (12,26,9)" value={fmtNum(tech.macd, 4)} signal={tech.macdTrend} good={tech.macdTrend === 'Bullish'} />
              <IndicatorCard name="Stochastic %K" value={fmtNum(tech.stochK)} signal={tech.stochK > 80 ? 'Overbought' : tech.stochK < 20 ? 'Oversold' : 'Neutral'} good={tech.stochK <= 80 && tech.stochK >= 20} />
              <IndicatorCard name="ADX (14)" value={fmtNum(tech.adx)} signal={tech.adxTrend} good={tech.adx > 20} />
              <IndicatorCard name="SMA 20" value={fmtNum(tech.sma20)} signal={tech.aboveSma20 ? 'Price above' : 'Price below'} good={tech.aboveSma20} />
              <IndicatorCard name="SMA 50" value={fmtNum(tech.sma50)} signal={tech.aboveSma50 ? 'Price above' : 'Price below'} good={tech.aboveSma50} />
              <IndicatorCard name="SMA 200" value={fmtNum(tech.sma200)} signal={tech.aboveSma200 ? 'Price above' : 'Price below'} good={tech.aboveSma200} />
              <IndicatorCard name="Bollinger Bands" value={`${fmtNum(tech.bbLower)} – ${fmtNum(tech.bbUpper)}`} signal={`Near ${tech.bbPosition}`} good={tech.bbPosition === 'Middle'} />
              <IndicatorCard name="VWAP" value={fmtNum(tech.vwap)} signal={quote.price > tech.vwap ? 'Above VWAP' : 'Below VWAP'} good={quote.price > tech.vwap} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Support & resistance</h3>
            <div className="space-y-2">
              {[...tech.resistances].reverse().map((r, i) => (
                <LevelBar key={`r${i}`} label="Resistance" level={r} price={quote.price} tone="bear" />
              ))}
              <LevelBar label="Current" level={quote.price} price={quote.price} tone="neutral" current />
              {[...tech.supports].reverse().map((s, i) => (
                <LevelBar key={`s${i}`} label="Support" level={s} price={quote.price} tone="bull" />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'fundamentals' && fund && fundScore && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-100">Fundamental scorecard</h3>
              <div className="text-right">
                <div className={`text-2xl font-bold ${fundScore.grade.startsWith('A') ? 'text-bull' : fundScore.grade === 'F' ? 'text-bear' : 'text-ink-100'}`}>{fundScore.grade}</div>
                <div className="text-xs text-ink-500">{fundScore.score}/100</div>
              </div>
            </div>
            <div className="space-y-3">
              {fundScore.pillars.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink-200">{p.name}</span>
                    <span className="text-ink-400">{p.score}/100 · <span className="text-ink-500">{p.note}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.score >= 65 ? 'bg-bull' : p.score >= 45 ? 'bg-accent-400' : 'bg-bear'}`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 pt-4 border-t border-white/5 text-sm text-ink-300">{fundScore.verdict}</p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Full ratios</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
              <KV label="P/E (ttm)" value={fmtNum(fund.pe)} />
              <KV label="Forward P/E" value={fmtNum(fund.forwardPe)} />
              <KV label="PEG ratio" value={fmtNum(fund.peg)} />
              <KV label="P/S" value={fmtNum(fund.ps)} />
              <KV label="P/B" value={fmtNum(fund.pb)} />
              <KV label="EV/EBITDA" value={fmtNum(fund.evEbitda)} />
              <KV label="ROE" value={fmtPct(fund.roe)} />
              <KV label="ROA" value={fmtPct(fund.roa)} />
              <KV label="ROIC" value={fmtPct(fund.roic)} />
              <KV label="Gross margin" value={fmtPct(fund.grossMargin)} />
              <KV label="Op margin" value={fmtPct(fund.operatingMargin)} />
              <KV label="Net margin" value={fmtPct(fund.netMargin)} />
              <KV label="Debt/equity" value={fmtNum(fund.debtToEquity)} />
              <KV label="Current ratio" value={fmtNum(fund.currentRatio)} />
              <KV label="Quick ratio" value={fmtNum(fund.quickRatio)} />
              <KV label="Rev growth" value={fmtPct(fund.revenueGrowth)} />
              <KV label="EPS growth" value={fmtPct(fund.earningsGrowth)} />
              <KV label="FCF yield" value={fmtPct(fund.fcfYield)} />
              <KV label="Payout ratio" value={fmtPct(fund.payoutRatio)} />
              <KV label="Div yield" value={fmtPct(fund.dividendYield)} />
              <KV label="Beta" value={fmtNum(fund.beta)} />
              <KV label="Shares out" value={fmtCompact(fund.sharesOut)} />
              <KV label="EV" value={`$${fmtCompact(fund.enterpriseValue)}`} />
            </div>
          </div>
        </div>
      )}

      {tab === 'financials' && (
        <div className="space-y-4">
          <FinancialTable title="Income statement" rows={income.map((i) => ({ ...i }))} columns={['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'ebitda', 'eps']} labels={{ revenue: 'Revenue', grossProfit: 'Gross profit', operatingIncome: 'Operating income', netIncome: 'Net income', ebitda: 'EBITDA', eps: 'EPS' }} />
          <FinancialTable title="Balance sheet" rows={balance.map((b) => ({ ...b }))} columns={['totalAssets', 'totalLiabilities', 'equity', 'cash', 'debt', 'inventory', 'receivables']} labels={{ totalAssets: 'Total assets', totalLiabilities: 'Total liabilities', equity: 'Equity', cash: 'Cash', debt: 'Debt', inventory: 'Inventory', receivables: 'Receivables' }} />
          <FinancialTable title="Cash flow" rows={cashflow.map((c) => ({ ...c }))} columns={['operatingCf', 'capex', 'freeCf', 'dividends', 'netDebtIssuance']} labels={{ operatingCf: 'Operating CF', capex: 'Capex', freeCf: 'Free CF', dividends: 'Dividends paid', netDebtIssuance: 'Net debt issuance' }} />
        </div>
      )}

      {tab === 'recommendation' && recommendation && (
        <div className="space-y-4">
          {/* Big recommendation card */}
          <div className="card p-6 relative overflow-hidden">
            <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl ${recommendation.action.includes('Buy') ? 'bg-bull/10' : recommendation.action.includes('Sell') ? 'bg-bear/10' : 'bg-accent-400/10'}`} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="text-center sm:text-left">
                <div className="text-xs text-ink-500 mb-1">Final recommendation</div>
                <div className={`text-4xl font-bold ${recommendation.action.includes('Buy') ? 'text-bull' : recommendation.action.includes('Sell') ? 'text-bear' : 'text-accent-400'}`}>{recommendation.action}</div>
                <div className="text-sm text-ink-400 mt-1">{recommendation.horizon} · {recommendation.confidence}% confidence</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
                  <span>Blended score</span>
                  <span className="font-mono text-ink-200">{recommendation.score}/100</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${recommendation.score >= 62 ? 'bg-bull' : recommendation.score <= 42 ? 'bg-bear' : 'bg-accent-400'}`}
                    style={{ width: `${recommendation.score}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <ScorePill label="Technical" value={recommendation.technicalScore} />
                  <ScorePill label="Fundamental" value={recommendation.fundamentalScore} />
                  <ScorePill label="Forecast" value={recommendation.forecastScore} />
                  <ScorePill label="Risk" value={recommendation.riskScore} />
                </div>
              </div>
            </div>
          </div>

          {/* Signal matrix */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-4 flex items-center gap-2"><Gauge size={16} /> Signal matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendation.signals.map((s) => (
                <div key={s.name} className="rounded-xl border border-white/5 bg-ink-950/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-400">{s.name}</span>
                    <span className={`chip ${s.signal === 'bullish' ? 'bg-bull/15 text-bull' : s.signal === 'bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>
                      {s.signal === 'bullish' ? <TrendingUp size={11} /> : s.signal === 'bearish' ? <TrendingDown size={11} /> : <Activity size={11} />}
                      {s.signal}
                    </span>
                  </div>
                  <div className="text-sm text-ink-200 mt-1">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rationale */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Rationale</h3>
            <ul className="space-y-2">
              {recommendation.rationale.map((r, i) => (
                <li key={i} className="text-sm text-ink-300 flex gap-2">
                  <span className="text-brand-400 mt-0.5">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'forecast' && forecastSet && (
        <div className="space-y-4">
          {/* Consensus */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100">Price forecast & scenarios</h3>
            </div>
            <p className="text-xs text-ink-500 mb-4">1-year forward projections from trend regression, momentum, fundamentals and volatility bands.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ScenarioCard label="Bear case" forecast={forecastSet.bear} tone="bear" price={quote.price} />
              <ScenarioCard label="Base case" forecast={forecastSet.base} tone="neutral" price={quote.price} highlight />
              <ScenarioCard label="Bull case" forecast={forecastSet.bull} tone="bull" price={quote.price} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <div className="text-xs text-ink-500">Consensus</div>
                <div className={`text-xl font-bold ${forecastSet.consensus.includes('Buy') ? 'text-bull' : forecastSet.consensus.includes('Sell') ? 'text-bear' : 'text-accent-400'}`}>{forecastSet.consensus}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-500">Score</div>
                <div className="text-xl font-mono text-ink-100">{forecastSet.consensusScore > 0 ? '+' : ''}{forecastSet.consensusScore}</div>
              </div>
            </div>
          </div>

          {/* Price target bar */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-4">Price target range (1Y)</h3>
            <PriceTargetBar current={quote.price} targets={forecastSet.priceTargets} />
          </div>

          {/* Market conditions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CondCard label="Trend" value={forecastSet.trendDirection} icon={<TrendingUp size={15} />} />
            <CondCard label="Momentum" value={forecastSet.momentum} icon={<Activity size={15} />} />
            <CondCard label="Volatility" value={forecastSet.volatility} icon={<Gauge size={15} />} />
            <CondCard label="Risk level" value={forecastSet.riskLevel} icon={<Shield size={15} />} />
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Analysis notes</h3>
            <ul className="space-y-2">
              {forecastSet.notes.map((n, i) => (
                <li key={i} className="text-sm text-ink-300 flex gap-2">
                  <span className="text-brand-400 mt-0.5">•</span> {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'ownership' && (
        <div className="card p-8 text-center text-ink-400 text-sm">
          Ownership / institutional holder breakdown requires a live data feed.
          The app is wired to accept one — drop in an API key in <code className="text-ink-200">src/lib/dataService.ts</code> to populate this tab.
        </div>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-ink-100 font-mono">{value}</div>
    </div>
  );
}

function IndicatorCard({ name, value, signal, good }: { name: string; value: string; signal: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-950/40 p-3">
      <div className="text-xs text-ink-500">{name}</div>
      <div className="text-base font-mono text-ink-100 mt-0.5">{value}</div>
      <div className={`text-xs mt-1 ${good ? 'text-bull' : 'text-bear'}`}>{signal}</div>
    </div>
  );
}

function LevelBar({ label, level, price, tone, current }: { label: string; level: number; price: number; tone: 'bull' | 'bear' | 'neutral'; current?: boolean }) {
  const dist = Math.abs(level - price) / price * 100;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-20 text-xs ${tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-ink-300'}`}>{label}</span>
      <span className="w-24 font-mono text-ink-100">{fmtNum(level)}</span>
      {current ? (
        <span className="chip bg-brand-500/15 text-brand-300">current</span>
      ) : (
        <span className="text-xs text-ink-500">{dist.toFixed(1)}% away</span>
      )}
    </div>
  );
}

function FinancialTable({ title, rows, columns, labels }: {
  title: string;
  rows: Record<string, number | string>[];
  columns: string[];
  labels: Record<string, string>;
}) {
  if (!rows.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 font-semibold text-ink-100 text-sm">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Metric</th>
              {rows.map((r) => <th key={r.period as string} className="text-right px-4 py-2 font-medium">{r.period}</th>)}
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c} className="border-t border-white/[0.03]">
                <td className="px-4 py-2 text-ink-300">{labels[c]}</td>
                {rows.map((r) => (
                  <td key={r.period as string} className="px-4 py-2 text-right font-mono text-ink-100">
                    {c === 'eps' ? fmtNum(r[c] as number) : fmtCompact(r[c] as number)}
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

function ScorePill({ label, value }: { label: string; value: number }) {
  const tone = value >= 65 ? 'text-bull' : value <= 40 ? 'text-bear' : 'text-accent-400';
  return (
    <div className="text-center rounded-lg bg-white/[0.03] py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-sm font-mono font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function ScenarioCard({ label, forecast: fc, tone, price, highlight }: {
  label: string;
  forecast: { targetPrice: number; expectedReturnPct: number; confidence: number };
  tone: 'bull' | 'bear' | 'neutral';
  price: number;
  highlight?: boolean;
}) {
  const color = tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-ink-100';
  const bg = highlight ? 'border-brand-500/40 bg-brand-500/[0.04]' : 'border-white/5';
  return (
    <div className={`rounded-xl border ${bg} p-4`}>
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${color}`}>{fmtNum(fc.targetPrice)}</div>
      <div className={`text-sm font-mono ${fc.expectedReturnPct >= 0 ? 'text-bull' : 'text-bear'}`}>
        {fc.expectedReturnPct >= 0 ? '+' : ''}{fc.expectedReturnPct}%
      </div>
      <div className="text-xs text-ink-500 mt-2">vs current {fmtNum(price)}</div>
      <div className="mt-2">
        <div className="text-[10px] text-ink-600 mb-0.5">Confidence {fc.confidence}%</div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-brand-500/60" style={{ width: `${fc.confidence}%` }} />
        </div>
      </div>
    </div>
  );
}

function PriceTargetBar({ current, targets }: { current: number; targets: { label: string; value: number }[] }) {
  const values = [current, ...targets.map((t) => t.value)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pct = (v: number) => ((v - min) / range) * 100;
  return (
    <div>
      <div className="relative h-12">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-bear via-accent-400 to-bull" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-center" style={{ left: `${pct(current)}%` }}>
          <div className="w-0.5 h-8 bg-ink-100 mx-auto" />
          <div className="text-[10px] text-ink-200 mt-1 whitespace-nowrap">Now {fmtNum(current)}</div>
        </div>
        {targets.map((t) => (
          <div key={t.label} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-center" style={{ left: `${pct(t.value)}%` }}>
            <div className="w-0.5 h-6 bg-ink-400 mx-auto" />
            <div className="text-[10px] text-ink-400 mt-1 whitespace-nowrap">{t.label}<br />{fmtNum(t.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CondCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">{icon} {label}</div>
      <div className="text-lg font-semibold text-ink-100 mt-1">{value}</div>
    </div>
  );
}

function ESGBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-ink-200">{label}</span>
        <span className="text-ink-400 font-mono">{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
