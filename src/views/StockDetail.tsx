import { useState, useMemo } from 'react';
import { Star, ArrowLeft, Plus, Target, TrendingUp, TrendingDown, Shield, Activity, Gauge, Brain, AlertTriangle, Lightbulb, Zap, Eye, BarChart3, Leaf, Users, Building2, FileText } from 'lucide-react';
import { getMeta, getCandles, getFundamentals, getIncomeStatements, getBalanceSheets, getCashFlows } from '../lib/dataService';
import { useLiveQuote } from '../lib/hooks';
import { analyzeTechnicals, scoreFundamentals } from '../lib/indicators';
import { forecast, recommend } from '../lib/forecast';
import { generateAIAnalysis } from '../lib/aiAnalysis';
import { useCurrency } from '../lib/currency';
import { fmtCompact, fmtPct, fmtPctRaw, fmtNum } from '../lib/format';
import { Sparkline } from '../components/Sparkline';
import type { Timeframe } from '../lib/types';

type Tab = 'overview' | 'ai' | 'recommendation' | 'technicals' | 'fundamentals' | 'financials' | 'forecast' | 'ownership';

interface Props {
  symbol: string; onBack: () => void; onOpenStock: (s: string) => void;
  watched: boolean; onToggleWatch: (s: string) => void; onAddHolding: (s: string) => void;
}

export function StockDetail({ symbol, onBack, onOpenStock, watched, onToggleWatch, onAddHolding }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [tf, setTf] = useState<Timeframe>('1Y');
  const meta = useMemo(() => getMeta(symbol), [symbol]);
  const quote = useLiveQuote(symbol);
  const candles = useMemo(() => getCandles(symbol, tf), [symbol, tf]);
  const tech = useMemo(() => (candles.length ? analyzeTechnicals(candles) : null), [candles]);
  const fund = useMemo(() => getFundamentals(symbol), [symbol]);
  const fundScore = useMemo(() => scoreFundamentals(fund), [fund]);
  const forecastSet = useMemo(() => (candles.length && fund ? forecast(candles, fund, tech) : null), [candles, fund, tech]);
  const recommendation = useMemo(() => (tech ? recommend(tech, fundScore?.score ?? 50, forecastSet, fund) : null), [tech, fundScore, forecastSet, fund]);
  const aiAnalysis = useMemo(() => (candles.length ? generateAIAnalysis(symbol, candles, fund, tech, forecastSet, recommendation) : null), [symbol, candles, fund, tech, forecastSet, recommendation]);
  const { formatPrice, formatCompact } = useCurrency();

  if (!meta || !quote) return <div className="card p-8 text-center text-ink-500">Loading {symbol}…</div>;
  const cur = meta.currency;
  const spark = getCandles(symbol, '1M').map((c) => c.c).filter((_, i) => i % 3 === 0).slice(-30);
  const timeframes: Timeframe[] = ['1W', '1M', '3M', '6M', '1Y', '5Y'];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-outline"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink-50">{symbol}</h1>
            <span className="chip bg-white/5 text-ink-400">{meta.exchange}</span>
            <span className="chip bg-white/5 text-ink-400 hidden sm:inline">{meta.region}</span>
          </div>
          <p className="text-sm text-ink-500 truncate">{meta.name} · {meta.sector} · {meta.industry}</p>
        </div>
        <button onClick={() => onToggleWatch(symbol)} className={`btn-outline ${watched ? 'text-accent-400' : ''}`}>
          <Star size={15} className={watched ? 'fill-accent-400' : ''} /> {watched ? 'Watched' : 'Watch'}
        </button>
        <button onClick={() => onAddHolding(symbol)} className="btn-primary"><Plus size={15} /> Add</button>
      </div>

      {/* Price bar */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div>
          <div className="text-2xl font-bold font-mono text-ink-50">{formatPrice(quote.price, cur)}</div>
          <div className={`text-sm font-mono ${quote.change >= 0 ? 'text-bull' : 'text-bear'}`}>
            {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePct >= 0 ? '+' : ''}{fmtPctRaw(quote.changePct)})
          </div>
        </div>
        <div className="w-32 h-12"><Sparkline points={spark} positive={quote.changePct >= 0} width={120} height={44} /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs ml-auto">
          <Mini label="Open" value={formatPrice(quote.open, cur)} />
          <Mini label="Day High" value={formatPrice(quote.dayHigh, cur)} />
          <Mini label="Day Low" value={formatPrice(quote.dayLow, cur)} />
          <Mini label="Prev Close" value={formatPrice(quote.prevClose, cur)} />
          <Mini label="Volume" value={fmtCompact(quote.volume)} />
          <Mini label="Mkt Cap" value={formatCompact(quote.marketCap, cur)} />
          <Mini label="P/E" value={fmtNum(quote.pe)} />
          <Mini label="52W Range" value={`${formatPrice(quote.yearLow, cur)} – ${formatPrice(quote.yearHigh, cur)}`} />
        </div>
      </div>

      {/* Chart timeframe */}
      <div className="flex items-center gap-1">
        {timeframes.map((t) => (
          <button key={t} onClick={() => setTf(t)} className={`px-3 py-1 rounded-md text-xs font-medium transition ${tf === t ? 'bg-brand-500/20 text-brand-300' : 'text-ink-500 hover:text-ink-300'}`}>{t}</button>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-4">
        <Chart candles={candles} />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex gap-1">
          {(['overview', 'ai', 'recommendation', 'technicals', 'fundamentals', 'financials', 'forecast', 'ownership'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition whitespace-nowrap ${tab === t ? 'tab-active' : 'border-transparent text-ink-400 hover:text-ink-200'}`}>
              {t === 'ai' ? 'AI Analysis' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && tech && fund && fundScore && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ScoreCard label="Technical" value={tech.score} max={100} verdict={tech.verdict} icon={<Activity size={16} />} />
            <ScoreCard label="Fundamental" value={fundScore.score} max={100} verdict={fundScore.grade} icon={<Shield size={16} />} />
            <ScoreCard label="Forecast" value={forecastSet?.consensusScore ?? 0} max={100} verdict={forecastSet?.consensus ?? 'N/A'} icon={<Target size={16} />} />
            <ScoreCard label="Recommendation" value={recommendation?.score ?? 50} max={100} verdict={recommendation?.action ?? 'Hold'} icon={<Gauge size={16} />} />
          </div>
          {recommendation && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink-100">Recommendation Summary</h3>
                <span className={`chip ${recommendation.action.includes('Buy') ? 'bg-bull/15 text-bull' : recommendation.action.includes('Sell') ? 'bg-bear/15 text-bear' : 'bg-accent-400/15 text-accent-400'}`}>{recommendation.action}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Mini2 label="Technical" value={`${recommendation.technicalScore}/100`} />
                <Mini2 label="Fundamental" value={`${recommendation.fundamentalScore}/100`} />
                <Mini2 label="Forecast" value={`${recommendation.forecastScore}/100`} />
                <Mini2 label="Confidence" value={`${recommendation.confidence}%`} />
              </div>
              <div className="mt-3 space-y-1">
                {recommendation.rationale.map((r, i) => <p key={i} className="text-sm text-ink-400">• {r}</p>)}
              </div>
            </div>
          )}
          {forecastSet && (
            <div className="card p-5">
              <h3 className="font-semibold text-ink-100 mb-3">Forecast Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <ForecastCard label="Bear" data={forecastSet.bear} cur={cur} formatPrice={formatPrice} tone="bear" />
                <ForecastCard label="Base" data={forecastSet.base} cur={cur} formatPrice={formatPrice} tone="neutral" />
                <ForecastCard label="Bull" data={forecastSet.bull} cur={cur} formatPrice={formatPrice} tone="bull" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {tab === 'ai' && aiAnalysis && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-brand-400" />
              <h3 className="font-semibold text-ink-100">AI Analysis Summary</h3>
              <span className={`chip ml-auto ${aiAnalysis.sentiment.includes('Bullish') ? 'bg-bull/15 text-bull' : aiAnalysis.sentiment.includes('Bearish') ? 'bg-bear/15 text-bear' : 'bg-accent-400/15 text-accent-400'}`}>{aiAnalysis.sentiment}</span>
            </div>
            <p className="text-sm text-ink-300 leading-relaxed">{aiAnalysis.summary}</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center"><div className="text-xs text-ink-500">Sentiment Score</div><div className={`text-lg font-bold font-mono ${aiAnalysis.sentimentScore >= 0 ? 'text-bull' : 'text-bear'}`}>{aiAnalysis.sentimentScore >= 0 ? '+' : ''}{aiAnalysis.sentimentScore}</div></div>
              <div className="text-center"><div className="text-xs text-ink-500">Confidence</div><div className="text-lg font-bold font-mono text-ink-100">{aiAnalysis.confidence}%</div></div>
              <div className="text-center"><div className="text-xs text-ink-500">Time Horizon</div><div className="text-lg font-bold text-ink-100">{aiAnalysis.timeHorizon}</div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-bull" /><h3 className="font-semibold text-ink-100">Bull Case</h3></div>
              <ul className="space-y-2">{aiAnalysis.bullCase.map((b, i) => <li key={i} className="text-sm text-ink-300 flex items-start gap-2"><span className="text-bull mt-0.5">+</span> {b}</li>)}</ul>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><TrendingDown size={16} className="text-bear" /><h3 className="font-semibold text-ink-100">Bear Case</h3></div>
              <ul className="space-y-2">{aiAnalysis.bearCase.map((b, i) => <li key={i} className="text-sm text-ink-300 flex items-start gap-2"><span className="text-bear mt-0.5">−</span> {b}</li>)}</ul>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-accent-400" /><h3 className="font-semibold text-ink-100">Key Risks</h3></div>
              <ul className="space-y-2">{aiAnalysis.keyRisks.map((r, i) => <li key={i} className="text-sm text-ink-300 flex items-start gap-2"><span className="text-accent-400 mt-0.5">!</span> {r}</li>)}</ul>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-brand-400" /><h3 className="font-semibold text-ink-100">Action Items</h3></div>
              <ul className="space-y-2">{aiAnalysis.actionItems.map((a, i) => <li key={i} className="text-sm text-ink-300 flex items-start gap-2"><span className="text-brand-400 mt-0.5">→</span> {a}</li>)}</ul>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Eye size={16} className="text-brand-300" /><h3 className="font-semibold text-ink-100">Pattern Recognition</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {aiAnalysis.patternRecognition.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <div><div className="text-sm text-ink-200">{p.pattern}</div><div className="text-xs text-ink-500">Confidence {p.confidence}%</div></div>
                  <span className={`chip ${p.signal === 'Bullish' ? 'bg-bull/15 text-bull' : p.signal === 'Bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{p.signal}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-accent-400" /><h3 className="font-semibold text-ink-100">Upcoming Catalysts</h3></div>
            <div className="space-y-2">
              {aiAnalysis.catalysts.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <div className="text-sm text-ink-200">{c.event}</div>
                  <div className="flex items-center gap-3"><span className="text-xs text-ink-500">{c.timing}</span><span className={`chip ${c.impact === 'High' ? 'bg-accent-400/15 text-accent-400' : c.impact === 'Medium' ? 'bg-brand-500/15 text-brand-300' : 'bg-white/5 text-ink-400'}`}>{c.impact}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><Leaf size={16} className="text-bull" /><h3 className="font-semibold text-ink-100">ESG Score</h3><span className="chip ml-auto bg-white/5 text-ink-300">Grade {aiAnalysis.esgScore.grade}</span></div>
              <div className="space-y-3"><ESGBar label="Environmental" value={aiAnalysis.esgScore.environmental} /><ESGBar label="Social" value={aiAnalysis.esgScore.social} /><ESGBar label="Governance" value={aiAnalysis.esgScore.governance} /></div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><BarChart3 size={16} className="text-brand-300" /><h3 className="font-semibold text-ink-100">Options Flow</h3><span className={`chip ml-auto ${aiAnalysis.optionsFlow.sentiment === 'Bullish' ? 'bg-bull/15 text-bull' : aiAnalysis.optionsFlow.sentiment === 'Bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{aiAnalysis.optionsFlow.sentiment}</span></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-ink-500">Call Volume</div><div className="font-mono text-bull">{aiAnalysis.optionsFlow.callVolume.toLocaleString()}</div></div>
                <div><div className="text-xs text-ink-500">Put Volume</div><div className="font-mono text-bear">{aiAnalysis.optionsFlow.putVolume.toLocaleString()}</div></div>
                <div><div className="text-xs text-ink-500">Put/Call Ratio</div><div className="font-mono text-ink-100">{aiAnalysis.optionsFlow.putCallRatio}</div></div>
                <div><div className="text-xs text-ink-500">Smart Money</div><div className="font-mono text-ink-100">{aiAnalysis.smartMoney.institutional}% inst</div></div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><Users size={16} className="text-accent-400" /><h3 className="font-semibold text-ink-100">Insider Activity</h3><span className={`chip ml-auto ${aiAnalysis.insiderActivity.sentiment === 'Positive' ? 'bg-bull/15 text-bull' : aiAnalysis.insiderActivity.sentiment === 'Negative' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{aiAnalysis.insiderActivity.sentiment}</span></div>
              <div className="text-sm text-ink-300"><div className="font-medium text-ink-100">{aiAnalysis.insiderActivity.type}</div><div className="text-ink-400 mt-1">{aiAnalysis.insiderActivity.detail}</div></div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-brand-300" /><h3 className="font-semibold text-ink-100">Earnings Estimate</h3></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-ink-500">Next Report</div><div className="text-ink-100">{aiAnalysis.earningsEstimate.nextDate}</div></div>
                <div><div className="text-xs text-ink-500">EPS Estimate</div><div className="font-mono text-ink-100">{fmtNum(aiAnalysis.earningsEstimate.epsEstimate)}</div></div>
                <div><div className="text-xs text-ink-500">Revenue Est.</div><div className="font-mono text-ink-100">{formatCompact(aiAnalysis.earningsEstimate.revenueEstimate, cur)}</div></div>
                <div><div className="text-xs text-ink-500">Surprise</div><div className={`font-mono ${aiAnalysis.earningsEstimate.surprisePct >= 0 ? 'text-bull' : 'text-bear'}`}>{aiAnalysis.earningsEstimate.surprisePct >= 0 ? '+' : ''}{aiAnalysis.earningsEstimate.surprisePct}%</div></div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Building2 size={16} className="text-brand-400" /><h3 className="font-semibold text-ink-100">Analyst Consensus</h3></div>
            <div className="flex items-center gap-6">
              <div><div className="text-xs text-ink-500">Rating</div><div className="text-lg font-bold text-ink-100">{aiAnalysis.analystConsensus.rating}</div></div>
              <div><div className="text-xs text-ink-500">Target Price</div><div className="text-lg font-bold font-mono text-brand-300">{formatPrice(aiAnalysis.analystConsensus.targetPrice, cur)}</div></div>
              <div><div className="text-xs text-ink-500">Analysts</div><div className="text-lg font-bold text-ink-100">{aiAnalysis.analystConsensus.count}</div></div>
            </div>
          </div>
        </div>
      )}
      {tab === 'ai' && !aiAnalysis && <div className="card p-8 text-center text-ink-500 text-sm">AI analysis requires price data. Loading…</div>}

      {/* Recommendation */}
      {tab === 'recommendation' && recommendation && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-100">Recommendation: {recommendation.action}</h3>
              <span className={`chip ${recommendation.action.includes('Buy') ? 'bg-bull/15 text-bull' : recommendation.action.includes('Sell') ? 'bg-bear/15 text-bear' : 'bg-accent-400/15 text-accent-400'}`}>{recommendation.confidence}% confidence</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Mini2 label="Technical" value={`${recommendation.technicalScore}/100`} />
              <Mini2 label="Fundamental" value={`${recommendation.fundamentalScore}/100`} />
              <Mini2 label="Forecast" value={`${recommendation.forecastScore}/100`} />
              <Mini2 label="Risk" value={`${recommendation.riskScore}/100`} />
            </div>
            <div className="space-y-1">{recommendation.rationale.map((r, i) => <p key={i} className="text-sm text-ink-400">• {r}</p>)}</div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Signals</h3>
            <div className="space-y-2">
              {recommendation.signals.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <div><div className="text-sm text-ink-200">{s.name}</div><div className="text-xs text-ink-500">{s.detail}</div></div>
                  <span className={`chip ${s.signal === 'bullish' ? 'bg-bull/15 text-bull' : s.signal === 'bearish' ? 'bg-bear/15 text-bear' : 'bg-white/5 text-ink-400'}`}>{s.signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Technicals */}
      {tab === 'technicals' && tech && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-4">Indicator Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Ind label="RSI (14)" value={fmtNum(tech.rsi)} signal={tech.rsiSignal} />
              <Ind label="MACD" value={fmtNum(tech.macd)} signal={tech.macdTrend} />
              <Ind label="MACD Hist" value={fmtNum(tech.macdHist)} signal={tech.macdTrend} />
              <Ind label="ADX" value={fmtNum(tech.adx)} signal={tech.adxTrend} />
              <Ind label="Stoch %K" value={fmtNum(tech.stochK)} signal={tech.stochK > 80 ? 'Overbought' : tech.stochK < 20 ? 'Oversold' : 'Neutral'} />
              <Ind label="Stoch %D" value={fmtNum(tech.stochD)} signal="—" />
              <Ind label="ATR" value={fmtNum(tech.atr)} signal={`${tech.atrPct}%`} />
              <Ind label="CCI" value={fmtNum(tech.cci)} signal={tech.cci > 100 ? 'Overbought' : tech.cci < -100 ? 'Oversold' : 'Neutral'} />
              <Ind label="Williams %R" value={fmtNum(tech.williamsR)} signal="—" />
              <Ind label="MFI" value={fmtNum(tech.mfi)} signal="—" />
              <Ind label="VWAP" value={formatPrice(tech.vwap, cur)} signal={quote.price > tech.vwap ? 'Above' : 'Below'} />
              <Ind label="OBV" value={fmtCompact(tech.obv)} signal={tech.obvTrend} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold text-ink-100 mb-3">Moving Averages</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">SMA 50</span><span className="font-mono text-ink-200">{formatPrice(tech.sma50, cur)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">SMA 200</span><span className="font-mono text-ink-200">{formatPrice(tech.sma200, cur)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Above SMA 50</span><span className={`font-mono ${tech.aboveSma50 ? 'text-bull' : 'text-bear'}`}>{tech.aboveSma50 ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Above SMA 200</span><span className={`font-mono ${tech.aboveSma200 ? 'text-bull' : 'text-bear'}`}>{tech.aboveSma200 ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink-100 mb-3">Bollinger Bands</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">Upper</span><span className="font-mono text-ink-200">{formatPrice(tech.bbUpper, cur)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Middle</span><span className="font-mono text-ink-200">{formatPrice(tech.bbMiddle, cur)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Lower</span><span className="font-mono text-ink-200">{formatPrice(tech.bbLower, cur)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Position</span><span className="font-mono text-brand-300">{tech.bbPosition}</span></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink-100 mb-3">Support Levels</h3>
              <div className="space-y-2 text-sm">{tech.supports.map((s, i) => <div key={i} className="flex justify-between"><span className="text-ink-400">S{i + 1}</span><span className="font-mono text-bull">{formatPrice(s, cur)}</span></div>)}</div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink-100 mb-3">Resistance Levels</h3>
              <div className="space-y-2 text-sm">{tech.resistances.map((r, i) => <div key={i} className="flex justify-between"><span className="text-ink-400">R{i + 1}</span><span className="font-mono text-bear">{formatPrice(r, cur)}</span></div>)}</div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Overall Technical Score</h3>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold font-mono ${tech.score >= 0 ? 'text-bull' : 'text-bear'}`}>{tech.score}</div>
              <div><div className="text-sm text-ink-200">{tech.verdict}</div><div className="text-xs text-ink-500">{tech.trend}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Fundamentals */}
      {tab === 'fundamentals' && fund && fundScore && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Fundamental Score: {fundScore.score}/100 (Grade {fundScore.grade})</h3>
            <div className="space-y-2">
              {fundScore.breakdown.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-ink-300">{b.label}</span><span className="text-ink-500 font-mono">{b.score}/{b.max}</span></div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${(b.score / b.max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Valuation Ratios</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Ind label="P/E" value={fmtNum(fund.pe)} signal="—" />
              <Ind label="Forward P/E" value={fmtNum(fund.forwardPe)} signal="—" />
              <Ind label="PEG" value={fmtNum(fund.peg)} signal={fund.peg < 1 ? 'Undervalued' : fund.peg > 2 ? 'Overvalued' : 'Fair'} />
              <Ind label="P/S" value={fmtNum(fund.ps)} signal="—" />
              <Ind label="P/B" value={fmtNum(fund.pb)} signal="—" />
              <Ind label="EV/EBITDA" value={fmtNum(fund.evEbitda)} signal="—" />
              <Ind label="FCF Yield" value={fmtPct(fund.fcfYield)} signal="—" />
              <Ind label="Div Yield" value={fmtPct(fund.dividendYield)} signal="—" />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Profitability & Growth</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Ind label="ROE" value={fmtPct(fund.roe)} signal="—" />
              <Ind label="ROA" value={fmtPct(fund.roa)} signal="—" />
              <Ind label="ROIC" value={fmtPct(fund.roic)} signal="—" />
              <Ind label="Gross Margin" value={fmtPct(fund.grossMargin)} signal="—" />
              <Ind label="Op Margin" value={fmtPct(fund.operatingMargin)} signal="—" />
              <Ind label="Net Margin" value={fmtPct(fund.netMargin)} signal="—" />
              <Ind label="Rev Growth" value={fmtPct(fund.revenueGrowth)} signal={fund.revenueGrowth > 0 ? 'Growing' : 'Declining'} />
              <Ind label="Earnings Growth" value={fmtPct(fund.earningsGrowth)} signal={fund.earningsGrowth > 0 ? 'Growing' : 'Declining'} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Financial Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Ind label="D/E Ratio" value={fmtNum(fund.debtToEquity)} signal={fund.debtToEquity < 1 ? 'Healthy' : 'Leveraged'} />
              <Ind label="Current Ratio" value={fmtNum(fund.currentRatio)} signal={fund.currentRatio > 1.5 ? 'Healthy' : 'Watch'} />
              <Ind label="Quick Ratio" value={fmtNum(fund.quickRatio)} signal="—" />
              <Ind label="Payout Ratio" value={fmtPct(fund.payoutRatio)} signal="—" />
              <Ind label="Beta" value={fmtNum(fund.beta)} signal={fund.beta > 1.5 ? 'High Vol' : 'Normal'} />
              <Ind label="Mkt Cap" value={formatCompact(fund.marketCap, cur)} signal="—" />
              <Ind label="EV" value={formatCompact(fund.enterpriseValue, cur)} signal="—" />
              <Ind label="Shares Out" value={fmtCompact(fund.sharesOut)} signal="—" />
            </div>
          </div>
        </div>
      )}

      {/* Financials */}
      {tab === 'financials' && (
        <div className="space-y-4 animate-fade-in">
          <FinancialTable title="Income Statements" data={getIncomeStatements(symbol)} cols={['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'ebitda', 'eps']} labels={['Revenue', 'Gross Profit', 'Op Income', 'Net Income', 'EBITDA', 'EPS']} format={(v) => fmtCompact(v)} />
          <FinancialTable title="Balance Sheets" data={getBalanceSheets(symbol)} cols={['totalAssets', 'totalLiabilities', 'equity', 'cash', 'debt', 'inventory']} labels={['Total Assets', 'Liabilities', 'Equity', 'Cash', 'Debt', 'Inventory']} format={(v) => fmtCompact(v)} />
          <FinancialTable title="Cash Flows" data={getCashFlows(symbol)} cols={['operatingCf', 'capex', 'freeCf', 'dividends', 'netDebtIssuance']} labels={['Operating CF', 'CapEx', 'Free CF', 'Dividends', 'Net Debt']} format={(v) => fmtCompact(v)} />
        </div>
      )}

      {/* Forecast */}
      {tab === 'forecast' && forecastSet && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Consensus: {forecastSet.consensus} (Score: {forecastSet.consensusScore > 0 ? '+' : ''}{forecastSet.consensusScore})</h3>
            <div className="grid grid-cols-3 gap-3">
              <ForecastCard label="Bear" data={forecastSet.bear} cur={cur} formatPrice={formatPrice} tone="bear" />
              <ForecastCard label="Base" data={forecastSet.base} cur={cur} formatPrice={formatPrice} tone="neutral" />
              <ForecastCard label="Bull" data={forecastSet.bull} cur={cur} formatPrice={formatPrice} tone="bull" />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Forecast Notes</h3>
            <div className="space-y-1">{forecastSet.notes.map((n, i) => <p key={i} className="text-sm text-ink-400">• {n}</p>)}</div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Ind label="Trend" value={forecastSet.trendDirection} signal="—" />
            <Ind label="Momentum" value={forecastSet.momentum} signal="—" />
            <Ind label="Volatility" value={forecastSet.volatility} signal="—" />
            <Ind label="Risk Level" value={forecastSet.riskLevel} signal="—" />
          </div>
        </div>
      )}

      {/* Ownership */}
      {tab === 'ownership' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-100 mb-3">Ownership Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-400">Institutional</span><span className="font-mono text-ink-200">{aiAnalysis?.smartMoney.institutional ?? 55}%</span></div>
              <div className="flex justify-between"><span className="text-ink-400">Retail</span><span className="font-mono text-ink-200">{aiAnalysis?.smartMoney.retail ?? 30}%</span></div>
              <div className="flex justify-between"><span className="text-ink-400">Insider</span><span className="font-mono text-ink-200">{100 - (aiAnalysis?.smartMoney.institutional ?? 55) - (aiAnalysis?.smartMoney.retail ?? 30)}%</span></div>
              <div className="flex justify-between"><span className="text-ink-400">Trend</span><span className="font-mono text-brand-300">{aiAnalysis?.smartMoney.trend ?? 'Neutral'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div><div className="text-ink-500">{label}</div><div className="font-mono text-ink-200">{value}</div></div>;
}
function Mini2({ label, value }: { label: string; value: string }) {
  return <div className="text-center p-2 rounded-lg bg-white/[0.03]"><div className="text-xs text-ink-500">{label}</div><div className="text-sm font-semibold text-ink-100">{value}</div></div>;
}
function ScoreCard({ label, value, max, verdict, icon }: { label: string; value: number; max: number; verdict: string; icon: React.ReactNode }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? 'text-bull' : pct >= 40 ? 'text-accent-400' : 'text-bear';
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">{icon} {label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-ink-400 mt-0.5">{verdict}</div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2"><div className={`h-full rounded-full ${pct >= 70 ? 'bg-bull' : pct >= 40 ? 'bg-accent-400' : 'bg-bear'}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
function Ind({ label, value, signal }: { label: string; value: string; signal: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.03]">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-sm font-mono text-ink-100 mt-0.5">{value}</div>
      <div className="text-[10px] text-ink-600 mt-0.5">{signal}</div>
    </div>
  );
}
function ForecastCard({ label, data, cur, formatPrice, tone }: { label: string; data: import('../lib/forecast').Forecast; cur: string; formatPrice: (n: number, from?: string) => string; tone: string }) {
  const color = tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-brand-300';
  return (
    <div className="p-3 rounded-lg bg-white/[0.03]">
      <div className={`text-xs font-semibold ${color}`}>{label} Case</div>
      <div className="text-lg font-bold font-mono text-ink-100 mt-1">{formatPrice(data.targetPrice, cur)}</div>
      <div className={`text-xs font-mono ${data.expectedReturnPct >= 0 ? 'text-bull' : 'text-bear'}`}>{data.expectedReturnPct >= 0 ? '+' : ''}{data.expectedReturnPct}%</div>
      <div className="text-[10px] text-ink-600 mt-1">Conf: {data.confidence}%</div>
    </div>
  );
}
function ESGBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1"><span className="text-ink-200">{label}</span><span className="text-ink-400 font-mono">{value}/100</span></div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${value}%` }} /></div>
    </div>
  );
}
function FinancialTable({ title, data, cols, labels, format }: { title: string; data: any[]; cols: string[]; labels: string[]; format: (v: number) => string }) {
  if (!data.length) return <div className="card p-5 text-center text-ink-500 text-sm">No data</div>;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold text-ink-200">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-ink-500 text-xs"><th className="text-left px-4 py-2">Metric</th>{data.map((d) => <th key={d.period} className="text-right px-4 py-2">{d.period}</th>)}</tr></thead>
          <tbody>
            {cols.map((col, i) => (
              <tr key={col} className="border-t border-white/[0.03]">
                <td className="px-4 py-2 text-ink-400">{labels[i]}</td>
                {data.map((d) => <td key={d.period} className="px-4 py-2 text-right font-mono text-ink-200">{format(d[col])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Chart({ candles }: { candles: import('../lib/types').Candle[] }) {
  if (!candles.length) return <div className="h-48 grid place-items-center text-ink-500 text-sm">No chart data</div>;
  const closes = candles.map((c) => c.c);
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const w = 800, h = 200;
  const step = w / (closes.length - 1);
  const path = closes.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 20) - 10).toFixed(1)}`).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  const positive = closes[closes.length - 1] >= closes[0];
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 'auto' }}>
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#cg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
