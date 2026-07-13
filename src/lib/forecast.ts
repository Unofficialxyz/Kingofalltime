import type { Candle, Fundamentals } from './types';
import { atr } from './indicators';
import type { TechnicalSummary } from './indicators';

export interface Forecast {
  horizon: string; targetPrice: number; expectedReturnPct: number;
  confidence: number; scenario: 'Bull' | 'Base' | 'Bear'; method: string;
}

export interface ForecastSet {
  bull: Forecast; base: Forecast; bear: Forecast;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  consensusScore: number;
  priceTargets: { label: string; value: number }[];
  trendDirection: 'Up' | 'Down' | 'Sideways';
  momentum: 'Strong' | 'Moderate' | 'Weak';
  volatility: 'High' | 'Medium' | 'Low';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  notes: string[];
}

function linRegSlope(values: number[]): { slope: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, r2: 0 };
  const xs = values.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (values[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = my - slope * mx;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) { const p = intercept + slope * xs[i]; ssTot += (values[i] - my) ** 2; ssRes += (values[i] - p) ** 2; }
  return { slope, r2: ssTot ? 1 - ssRes / ssTot : 0 };
}

export function forecast(candles: Candle[], fund: Fundamentals | null, tech: TechnicalSummary | null): ForecastSet | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const price = closes[closes.length - 1];
  const recent = closes.slice(-60);
  const { slope, r2 } = linRegSlope(recent);
  const dailySlopePct = price ? slope / price : 0;
  const atrArr = atr(candles, 14);
  const atrVal = (atrArr[atrArr.length - 1] ?? price * 0.02) as number;
  const volPct = price ? atrVal / price : 0.02;
  const rsiVal = tech?.rsi ?? 50;
  const fundDrift = fund ? (fund.revenueGrowth * 0.3 + fund.earningsGrowth * 0.3 + (fund.roe - 0.12) * 0.2 + (fund.netMargin - 0.1) * 0.1) : 0;
  const horizons = [{ label: '1 month', days: 21 }, { label: '3 months', days: 63 }, { label: '1 year', days: 252 }];
  const make = (label: string, days: number, scenario: 'Bull' | 'Base' | 'Bear'): Forecast => {
    const trendC = dailySlopePct * days * (r2 > 0.3 ? 1 : 0.4);
    const momC = ((rsiVal - 50) / 50) * 0.05 * (days / 63);
    const fundC = fundDrift * (days / 252);
    const volBand = volPct * Math.sqrt(days / 21) * (scenario === 'Bull' ? 1.5 : scenario === 'Bear' ? -1.5 : 0.3);
    const ret = trendC + momC + fundC + volBand;
    const target = price * (1 + ret);
    const conf = Math.max(15, Math.min(92, 40 + r2 * 30 + (tech && tech.adx > 25 ? 12 : -8) + (volPct < 0.03 ? 10 : volPct > 0.06 ? -12 : 0) + (scenario === 'Base' ? 8 : 0)));
    return { horizon: label, targetPrice: +target.toFixed(2), expectedReturnPct: +(ret * 100).toFixed(1), confidence: +conf.toFixed(0), scenario, method: 'Linear trend + momentum + fundamentals + volatility band' };
  };
  const bull = make(horizons[2].label, horizons[2].days, 'Bull');
  const base = make(horizons[2].label, horizons[2].days, 'Base');
  const bear = make(horizons[2].label, horizons[2].days, 'Bear');
  const techScore = tech?.score ?? 0;
  const blended = (bull.expectedReturnPct * 0.3 + base.expectedReturnPct * 0.5 + bear.expectedReturnPct * 0.2);
  const consensusScore = Math.max(-100, Math.min(100, blended * 2 + techScore * 0.4));
  const consensus: ForecastSet['consensus'] = consensusScore >= 35 ? 'Strong Buy' : consensusScore >= 12 ? 'Buy' : consensusScore <= -35 ? 'Strong Sell' : consensusScore <= -12 ? 'Sell' : 'Hold';
  const priceTargets = [{ label: 'Bear (1Y)', value: bear.targetPrice }, { label: 'Base (1Y)', value: base.targetPrice }, { label: 'Bull (1Y)', value: bull.targetPrice }];
  const trendDirection: ForecastSet['trendDirection'] = slope > 0 && r2 > 0.3 ? 'Up' : slope < 0 && r2 > 0.3 ? 'Down' : 'Sideways';
  const momentum: ForecastSet['momentum'] = Math.abs(rsiVal - 50) > 20 && Math.abs(tech?.macdHist ?? 0) > price * 0.001 ? 'Strong' : Math.abs(rsiVal - 50) > 10 ? 'Moderate' : 'Weak';
  const volatility: ForecastSet['volatility'] = volPct > 0.05 ? 'High' : volPct > 0.025 ? 'Medium' : 'Low';
  const riskLevel: ForecastSet['riskLevel'] = volPct > 0.07 ? 'Very High' : volPct > 0.05 ? 'High' : volPct > 0.03 ? 'Medium' : 'Low';
  const notes: string[] = [];
  notes.push(`Trend is ${trendDirection.toLowerCase()} (R²=${r2.toFixed(2)}).`);
  notes.push(`Momentum is ${momentum.toLowerCase()} (RSI ${rsiVal.toFixed(0)}).`);
  notes.push(`Volatility is ${volatility.toLowerCase()} (ATR ${(volPct * 100).toFixed(1)}% of price).`);
  if (fund) {
    if (fund.revenueGrowth > 0.15) notes.push('Strong revenue growth supports the bullish case.');
    if (fund.revenueGrowth < 0) notes.push('Declining revenue is a headwind.');
    if (fund.debtToEquity > 1.2) notes.push('Elevated leverage increases downside risk.');
    if (fund.roe > 0.2) notes.push('High ROE indicates efficient capital allocation.');
  }
  if (tech && tech.rsi > 70) notes.push('RSI overbought — near-term pullback risk.');
  if (tech && tech.rsi < 30) notes.push('RSI oversold — potential bounce setup.');
  return { bull, base, bear, consensus, consensusScore, priceTargets, trendDirection, momentum, volatility, riskLevel, notes };
}

export interface Recommendation {
  action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  score: number; confidence: number; horizon: 'Short-term' | 'Medium-term' | 'Long-term';
  rationale: string[]; technicalScore: number; fundamentalScore: number;
  forecastScore: number; riskScore: number;
  signals: { name: string; signal: 'bullish' | 'bearish' | 'neutral'; detail: string }[];
}

export function recommend(tech: TechnicalSummary | null, fundGrade: number, fc: ForecastSet | null, fund: Fundamentals | null): Recommendation | null {
  if (!tech) return null;
  const technicalScore = (tech.score + 100) / 2;
  const fundamentalScore = fundGrade;
  const forecastScore = fc ? (fc.consensusScore + 100) / 2 : 50;
  let riskScore = 70;
  if (fund) {
    if (fund.debtToEquity > 1.5) riskScore -= 15; else if (fund.debtToEquity > 1) riskScore -= 8;
    if (fund.beta > 1.5) riskScore -= 10; else if (fund.beta > 1.2) riskScore -= 5;
    if (fund.currentRatio < 1) riskScore -= 10;
  }
  if (fc && fc.riskLevel === 'Very High') riskScore -= 15; else if (fc && fc.riskLevel === 'High') riskScore -= 8;
  riskScore = Math.max(10, Math.min(100, riskScore));
  const blended = technicalScore * 0.35 + fundamentalScore * 0.30 + forecastScore * 0.25 + riskScore * 0.10;
  const score = Math.max(0, Math.min(100, blended));
  const action: Recommendation['action'] = score >= 80 ? 'Strong Buy' : score >= 62 ? 'Buy' : score <= 25 ? 'Strong Sell' : score <= 42 ? 'Sell' : 'Hold';
  const confidence = Math.round(Math.min(95, 40 + Math.abs(score - 50) * 1.1));
  const horizon: Recommendation['horizon'] = action === 'Hold' ? 'Medium-term' : score >= 70 || score <= 30 ? 'Long-term' : 'Short-term';
  const signals: Recommendation['signals'] = [
    { name: 'Trend (SMA stack)', signal: tech.aboveSma200 && tech.aboveSma50 ? 'bullish' : !tech.aboveSma200 && !tech.aboveSma50 ? 'bearish' : 'neutral', detail: tech.trend },
    { name: 'RSI (14)', signal: tech.rsi < 30 ? 'bullish' : tech.rsi > 70 ? 'bearish' : 'neutral', detail: `${tech.rsi} — ${tech.rsiSignal}` },
    { name: 'MACD', signal: tech.macdTrend === 'Bullish' ? 'bullish' : tech.macdTrend === 'Bearish' ? 'bearish' : 'neutral', detail: tech.macdTrend },
    { name: 'Bollinger position', signal: tech.bbPosition === 'Lower' ? 'bullish' : tech.bbPosition === 'Upper' ? 'bearish' : 'neutral', detail: `Near ${tech.bbPosition} band` },
  ];
  if (fc) signals.push({ name: 'Forecast consensus', signal: fc.consensus.includes('Buy') ? 'bullish' : fc.consensus.includes('Sell') ? 'bearish' : 'neutral', detail: `${fc.consensus} (${fc.consensusScore > 0 ? '+' : ''}${fc.consensusScore})` });
  if (fund) {
    signals.push({ name: 'Valuation (P/E vs growth)', signal: fund.peg < 1 ? 'bullish' : fund.peg > 2 ? 'bearish' : 'neutral', detail: `PEG ${fund.peg.toFixed(1)}` });
    signals.push({ name: 'Financial health', signal: fund.debtToEquity < 0.5 && fund.currentRatio > 1.5 ? 'bullish' : fund.debtToEquity > 1.5 ? 'bearish' : 'neutral', detail: `D/E ${fund.debtToEquity.toFixed(1)}` });
  }
  const rationale: string[] = [
    `Technical score ${tech.score}/100 → ${tech.verdict}.`,
    `Fundamental grade ${fundGrade}/100${fund ? ` (P/E ${fund.pe.toFixed(1)}, ROE ${(fund.roe * 100).toFixed(0)}%)` : ''}.`,
  ];
  if (fc) { rationale.push(`Forecast consensus: ${fc.consensus} with base-case target ${fc.base.targetPrice}.`); rationale.push(`Risk level: ${fc.riskLevel}.`); }
  rationale.push(`Blended score ${score.toFixed(0)}/100 → ${action}.`);
  return { action, score: +score.toFixed(0), confidence, horizon, rationale, technicalScore: +technicalScore.toFixed(0), fundamentalScore: +fundamentalScore.toFixed(0), forecastScore: +forecastScore.toFixed(0), riskScore: +riskScore.toFixed(0), signals };
}
