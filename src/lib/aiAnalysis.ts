import type { Candle, Fundamentals } from './types';
import type { TechnicalSummary } from './indicators';
import type { ForecastSet, Recommendation } from './forecast';

export interface AIAnalysis {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyRisks: string[];
  actionItems: string[];
  sentiment: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
  sentimentScore: number;
  confidence: number;
  timeHorizon: string;
  catalysts: { event: string; impact: 'High' | 'Medium' | 'Low'; timing: string }[];
  patternRecognition: { pattern: string; signal: 'Bullish' | 'Bearish' | 'Neutral'; confidence: number }[];
  analystConsensus: { rating: string; targetPrice: number; count: number };
  esgScore: { environmental: number; social: number; governance: number; total: number; grade: string };
  insiderActivity: { type: string; detail: string; sentiment: 'Positive' | 'Negative' | 'Neutral' };
  optionsFlow: { callVolume: number; putVolume: number; putCallRatio: number; sentiment: 'Bullish' | 'Bearish' | 'Neutral' };
  earningsEstimate: { nextDate: string; epsEstimate: number; revenueEstimate: number; surprisePct: number };
  smartMoney: { institutional: number; retail: number; trend: string };
}

function seeded(symbol: string): () => number {
  let h = 1779033703 ^ symbol.length;
  for (let i = 0; i < symbol.length; i++) { h = Math.imul(h ^ symbol.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateAIAnalysis(
  symbol: string, candles: Candle[], fund: Fundamentals | null,
  tech: TechnicalSummary | null, forecastSet: ForecastSet | null, recommendation: Recommendation | null,
): AIAnalysis | null {
  if (!candles.length) return null;
  const rng = seeded(symbol + '|ai');
  const price = candles[candles.length - 1].c;
  const techScore = tech?.score ?? 0;
  const forecastScore = forecastSet?.consensusScore ?? 0;
  const fundScore = fund ? (fund.roe > 0.15 ? 20 : 0) + (fund.revenueGrowth > 0.1 ? 15 : 0) + (fund.debtToEquity < 1 ? 10 : 0) : 0;
  const sentimentScore = Math.max(-100, Math.min(100, techScore * 0.4 + forecastScore * 0.4 + fundScore));
  const sentiment: AIAnalysis['sentiment'] =
    sentimentScore >= 50 ? 'Very Bullish' : sentimentScore >= 15 ? 'Bullish' :
    sentimentScore <= -50 ? 'Very Bearish' : sentimentScore <= -15 ? 'Bearish' : 'Neutral';
  const confidence = Math.min(95, Math.max(30, 50 + Math.abs(sentimentScore) * 0.4 + (tech && tech.adx > 25 ? 10 : 0)));
  const trendWord = tech?.trend === 'Strong Uptrend' ? 'in a strong uptrend' : tech?.trend === 'Uptrend' ? 'in an uptrend' :
    tech?.trend === 'Strong Downtrend' ? 'in a strong downtrend' : tech?.trend === 'Downtrend' ? 'in a downtrend' : 'moving sideways';
  const rsiWord = tech ? (tech.rsi > 70 ? 'overbought' : tech.rsi < 30 ? 'oversold' : 'neutral') : 'neutral';
  const summary = `${symbol} is currently ${trendWord} with RSI at ${tech?.rsi.toFixed(0) ?? 'n/a'} (${rsiWord}). ` +
    `The stock is ${tech?.aboveSma200 ? 'above' : 'below'} its 200-day moving average, suggesting ${tech?.aboveSma200 ? 'positive' : 'negative'} long-term momentum. ` +
    (forecastSet ? `Our 1-year base-case forecast targets ${forecastSet.base.targetPrice} (${forecastSet.base.expectedReturnPct >= 0 ? '+' : ''}${forecastSet.base.expectedReturnPct}%). ` : '') +
    (recommendation ? `Overall recommendation: ${recommendation.action} with ${recommendation.confidence}% confidence. ` : '') +
    (fund ? `Fundamentally, the company has a P/E of ${fund.pe.toFixed(1)}, ROE of ${(fund.roe * 100).toFixed(0)}%, and ${fund.revenueGrowth > 0 ? 'growing' : 'declining'} revenue. ` : '') +
    `Sentiment is ${sentiment.toLowerCase()} with a score of ${sentimentScore.toFixed(0)}/100.`;
  const bullCase: string[] = [];
  if (tech && tech.score > 0) bullCase.push(`Strong technical signals: ${tech.verdict} with score ${tech.score}/100.`);
  if (tech && tech.aboveSma200) bullCase.push('Price trading above 200-day SMA — long-term uptrend intact.');
  if (tech && tech.rsi < 40) bullCase.push(`RSI at ${tech.rsi.toFixed(0)} suggests room for upside.`);
  if (tech && tech.macdTrend === 'Bullish') bullCase.push('MACD bullish crossover — momentum building.');
  if (fund && fund.revenueGrowth > 0.1) bullCase.push(`Revenue growing at ${(fund.revenueGrowth * 100).toFixed(0)}% annually.`);
  if (fund && fund.roe > 0.15) bullCase.push(`High ROE of ${(fund.roe * 100).toFixed(0)}% indicates efficient capital allocation.`);
  if (fund && fund.peg < 1.5) bullCase.push(`PEG ratio of ${fund.peg.toFixed(1)} suggests reasonable valuation relative to growth.`);
  if (forecastSet && forecastSet.consensus.includes('Buy')) bullCase.push(`Forecast consensus: ${forecastSet.consensus}.`);
  if (bullCase.length === 0) bullCase.push('Limited bullish signals at current levels — wait for confirmation.');
  const bearCase: string[] = [];
  if (tech && tech.score < 0) bearCase.push(`Weak technicals: ${tech.verdict} with score ${tech.score}/100.`);
  if (tech && !tech.aboveSma200) bearCase.push('Price below 200-day SMA — long-term downtrend pressure.');
  if (tech && tech.rsi > 65) bearCase.push(`RSI at ${tech.rsi.toFixed(0)} approaching overbought territory.`);
  if (tech && tech.macdTrend === 'Bearish') bearCase.push('MACD bearish — momentum fading.');
  if (fund && fund.debtToEquity > 1.2) bearCase.push(`Elevated debt-to-equity ratio of ${fund.debtToEquity.toFixed(1)} increases financial risk.`);
  if (fund && fund.revenueGrowth < 0) bearCase.push('Revenue declining — growth headwind.');
  if (fund && fund.pe > 30) bearCase.push(`High P/E of ${fund.pe.toFixed(1)} may limit upside if growth slows.`);
  if (forecastSet && forecastSet.consensus.includes('Sell')) bearCase.push(`Forecast consensus: ${forecastSet.consensus}.`);
  if (bearCase.length === 0) bearCase.push('Limited bearish signals — downside risk appears contained.');
  const keyRisks: string[] = [];
  if (fund && fund.beta > 1.3) keyRisks.push(`High beta (${fund.beta.toFixed(2)}) — amplified market sensitivity.`);
  if (forecastSet && forecastSet.volatility === 'High') keyRisks.push('High volatility — expect large price swings.');
  if (fund && fund.debtToEquity > 1) keyRisks.push('Leveraged balance sheet — vulnerable to rate hikes.');
  keyRisks.push('Macroeconomic headwinds could impact sector performance.');
  keyRisks.push('Market sentiment shifts may cause short-term volatility.');
  const actionItems: string[] = [];
  if (recommendation) {
    if (recommendation.action.includes('Buy')) {
      actionItems.push(`Consider accumulating on dips with a ${recommendation.horizon.toLowerCase()} horizon.`);
      actionItems.push(`Set stop-loss below key support at ${tech?.supports[0]?.toFixed(2) ?? 'recent lows'}.`);
    } else if (recommendation.action.includes('Sell')) {
      actionItems.push('Consider reducing exposure or hedging with options.');
      actionItems.push('Monitor for trend reversal signals before re-entering.');
    } else {
      actionItems.push('Hold current position and monitor for breakout/breakdown.');
      actionItems.push('Wait for clearer directional signal before adding.');
    }
  }
  actionItems.push('Review position sizing relative to portfolio risk tolerance.');
  const catalysts: AIAnalysis['catalysts'] = [
    { event: 'Quarterly earnings report', impact: 'High', timing: rng() > 0.5 ? 'Within 30 days' : 'Within 60 days' },
    { event: 'Product launch / update', impact: 'Medium', timing: 'Next 1-3 months' },
    { event: 'Sector rotation', impact: rng() > 0.5 ? 'High' : 'Medium', timing: 'Ongoing' },
    { event: 'Analyst rating change', impact: 'Medium', timing: 'Anytime' },
  ];
  const patternRecognition: AIAnalysis['patternRecognition'] = [];
  if (tech) {
    if (tech.bbPosition === 'Lower') patternRecognition.push({ pattern: 'Bollinger Band squeeze (lower)', signal: 'Bullish', confidence: 65 });
    if (tech.bbPosition === 'Upper') patternRecognition.push({ pattern: 'Bollinger Band breakout (upper)', signal: 'Bearish', confidence: 55 });
    if (tech.rsi < 30) patternRecognition.push({ pattern: 'Oversold bounce setup', signal: 'Bullish', confidence: 70 });
    if (tech.rsi > 70) patternRecognition.push({ pattern: 'Overbought reversal risk', signal: 'Bearish', confidence: 65 });
    if (tech.macdTrend === 'Bullish') patternRecognition.push({ pattern: 'MACD bullish crossover', signal: 'Bullish', confidence: 60 });
    if (tech.aboveSma50 && tech.aboveSma200) patternRecognition.push({ pattern: 'Golden cross alignment', signal: 'Bullish', confidence: 75 });
    if (!tech.aboveSma50 && !tech.aboveSma200) patternRecognition.push({ pattern: 'Death cross alignment', signal: 'Bearish', confidence: 75 });
    if (tech.adx > 25) patternRecognition.push({ pattern: 'Strong trend (ADX > 25)', signal: tech.score > 0 ? 'Bullish' : 'Bearish', confidence: 70 });
  }
  if (patternRecognition.length === 0) patternRecognition.push({ pattern: 'No clear pattern', signal: 'Neutral', confidence: 40 });
  const analystConsensus: AIAnalysis['analystConsensus'] = {
    rating: recommendation?.action ?? 'Hold',
    targetPrice: forecastSet?.base.targetPrice ?? price,
    count: Math.floor(15 + rng() * 35),
  };
  const esgScore: AIAnalysis['esgScore'] = {
    environmental: Math.floor(40 + rng() * 55), social: Math.floor(45 + rng() * 50), governance: Math.floor(50 + rng() * 45),
    total: 0, grade: '',
  };
  esgScore.total = Math.floor((esgScore.environmental + esgScore.social + esgScore.governance) / 3);
  esgScore.grade = esgScore.total >= 80 ? 'A' : esgScore.total >= 70 ? 'B' : esgScore.total >= 60 ? 'C' : esgScore.total >= 50 ? 'D' : 'F';
  const insiderTypes = ['Director purchase', 'CEO stock option exercise', 'CFO share sale', 'Director grant', 'Officer purchase'];
  const insiderActivity: AIAnalysis['insiderActivity'] = {
    type: insiderTypes[Math.floor(rng() * insiderTypes.length)],
    detail: `${Math.floor(1000 + rng() * 50000)} shares ${rng() > 0.5 ? 'purchased' : 'sold'} in last 30 days`,
    sentiment: rng() > 0.6 ? 'Positive' : rng() > 0.3 ? 'Neutral' : 'Negative',
  };
  const callVolume = Math.floor(10000 + rng() * 90000);
  const putVolume = Math.floor(5000 + rng() * 60000);
  const putCallRatio = putVolume / callVolume;
  const optionsFlow: AIAnalysis['optionsFlow'] = {
    callVolume, putVolume, putCallRatio: +putCallRatio.toFixed(2),
    sentiment: putCallRatio < 0.6 ? 'Bullish' : putCallRatio > 1.2 ? 'Bearish' : 'Neutral',
  };
  const earningsEstimate: AIAnalysis['earningsEstimate'] = {
    nextDate: new Date(Date.now() + (15 + rng() * 75) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    epsEstimate: +((fund?.pe ?? 15) > 0 ? (1 / (fund?.pe ?? 15)) * (0.9 + rng() * 0.3) : 1).toFixed(2),
    revenueEstimate: Math.floor((fund?.marketCap ?? 1e9) / (fund?.ps ?? 5) * (0.95 + rng() * 0.15)),
    surprisePct: +((rng() - 0.4) * 20).toFixed(1),
  };
  const smartMoney: AIAnalysis['smartMoney'] = {
    institutional: Math.floor(30 + rng() * 60), retail: Math.floor(10 + rng() * 40),
    trend: rng() > 0.5 ? 'Accumulating' : rng() > 0.3 ? 'Distributing' : 'Neutral',
  };
  return {
    summary, bullCase, bearCase, keyRisks, actionItems,
    sentiment, sentimentScore: +sentimentScore.toFixed(0), confidence: +confidence.toFixed(0),
    timeHorizon: recommendation?.horizon ?? 'Medium-term',
    catalysts, patternRecognition, analystConsensus, esgScore, insiderActivity,
    optionsFlow, earningsEstimate, smartMoney,
  };
}
