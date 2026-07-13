import type { Candle, Fundamentals } from "./types";
import type { TechnicalSummary } from "./indicators";

// ─── FORECAST ────────────────────────────────────────────────────────────────
export interface Forecast {
  horizon: string;
  targetPrice: number;
  expectedReturnPct: number;
  confidence: number;
  scenario: string;
  method: string;
}

export interface ForecastSet {
  bull: Forecast;
  base: Forecast;
  bear: Forecast;
  consensus: string;
  consensusScore: number;
  priceTargets: number[];
  trendDirection: string;
  momentum: string;
  volatility: string;
  riskLevel: string;
  notes: string[];
}

export function forecast(
  candles: Candle[],
  fund: Fundamentals,
  tech: TechnicalSummary
): ForecastSet | null {
  if (!candles.length || !tech) return null;
  const price = candles[candles.length - 1].c;
  const atrPct = tech.atrPct / 100;

  // Annualized drift from technical score
  const drift = tech.score / 100 * 0.25; // up to +/-25% annual

  // Volatility band
  const volLow = Math.max(0.05, atrPct * Math.sqrt(252) * 0.5);
  const volHigh = volLow * 1.8;

  const bullTarget = price * (1 + drift + volHigh);
  const baseTarget = price * (1 + drift);
  const bearTarget = price * (1 + drift - volHigh);

  const confidenceBase = Math.min(0.95, 0.4 + Math.abs(tech.score) / 200);

  const bull: Forecast = {
    horizon: "12 months",
    targetPrice: round(bullTarget),
    expectedReturnPct: round(((bullTarget - price) / price) * 100),
    confidence: round(confidenceBase * 0.8, 2),
    scenario: "Bull",
    method: "Technical drift + volatility upper band",
  };

  const base: Forecast = {
    horizon: "12 months",
    targetPrice: round(baseTarget),
    expectedReturnPct: round(((baseTarget - price) / price) * 100),
    confidence: round(confidenceBase, 2),
    scenario: "Base",
    method: "Technical drift (mean expectation)",
  };

  const bear: Forecast = {
    horizon: "12 months",
    targetPrice: round(bearTarget),
    expectedReturnPct: round(((bearTarget - price) / price) * 100),
    confidence: round(confidenceBase * 0.8, 2),
    scenario: "Bear",
    method: "Technical drift - volatility lower band",
  };

  const consensusScore = round((bull.expectedReturnPct + base.expectedReturnPct + bear.expectedReturnPct) / 3, 2);
  const consensus = consensusScore > 10 ? "Bullish" : consensusScore < -10 ? "Bearish" : "Neutral";
  const priceTargets = [round(bearTarget), round(baseTarget), round(bullTarget)];

  const trendDirection = tech.trend;
  const momentum = tech.rsi > 55 ? "Positive" : tech.rsi < 45 ? "Negative" : "Neutral";
  const volatility = atrPct > 0.03 ? "High" : atrPct > 0.015 ? "Moderate" : "Low";
  const riskLevel = atrPct > 0.04 ? "High" : atrPct > 0.02 ? "Medium" : "Low";

  const notes: string[] = [];
  notes.push("12-month price target derived from " + tech.trend.toLowerCase() + " technical setup.");
  notes.push("Volatility estimate of " + (atrPct * 100).toFixed(1) + "% daily ATR drives the bull/bear spread.");
  if (tech.score > 30) notes.push("Technical score of " + tech.score + " suggests upward bias.");
  else if (tech.score < -30) notes.push("Technical score of " + tech.score + " suggests downward bias.");
  else notes.push("Technical score of " + tech.score + " suggests range-bound action.");
  if (fund.pe > 35) notes.push("Elevated P/E of " + fund.pe + " may limit upside from valuation expansion.");
  if (fund.revenueGrowth > 15) notes.push("Revenue growth of " + fund.revenueGrowth + "% supports the bullish case.");
  if (fund.debtToEquity > 2) notes.push("High debt-to-equity of " + fund.debtToEquity + " adds downside risk.");

  return {
    bull,
    base,
    bear,
    consensus,
    consensusScore,
    priceTargets,
    trendDirection,
    momentum,
    volatility,
    riskLevel,
    notes,
  };
}

// ─── RECOMMENDATION ──────────────────────────────────────────────────────────
export interface Recommendation {
  action: string;
  score: number;
  confidence: number;
  horizon: string;
  rationale: string[];
  technicalScore: number;
  fundamentalScore: number;
  forecastScore: number;
  riskScore: number;
  signals: string[];
}

export function recommend(
  tech: TechnicalSummary | null,
  fundGrade: string,
  fc: ForecastSet | null,
  fund: Fundamentals
): Recommendation | null {
  if (!tech || !fc) return null;

  const signals: string[] = [];
  const rationale: string[] = [];

  const technicalScore = tech.score;
  const gradeToNum: Record<string, number> = { "A": 90, "B": 75, "C": 60, "D": 45, "F": 25 };
  const fundamentalScore = gradeToNum[fundGrade] ?? 50;
  const forecastScore = Math.max(-100, Math.min(100, fc.consensusScore * 2));
  const riskScore = fc.riskLevel === "High" ? 20 : fc.riskLevel === "Medium" ? 50 : 80;

  // Weighted composite
  const composite = Math.round(
    technicalScore * 0.35 +
    (fundamentalScore - 50) * 0.3 +
    forecastScore * 0.25 +
    (riskScore - 50) * 0.1
  );

  // Signals
  if (tech.rsi < 30) { signals.push("RSI oversold"); rationale.push("RSI at " + tech.rsi + " indicates oversold conditions."); }
  if (tech.rsi > 70) { signals.push("RSI overbought"); rationale.push("RSI at " + tech.rsi + " indicates overbought conditions."); }
  if (tech.macdHist > 0) { signals.push("MACD bullish cross"); rationale.push("MACD histogram positive, momentum building."); }
  if (tech.macdHist < 0) { signals.push("MACD bearish cross"); rationale.push("MACD histogram negative, momentum fading."); }
  if (tech.aboveSma200) { signals.push("Above 200 SMA"); rationale.push("Price above 200-day SMA confirms long-term uptrend."); }
  else { signals.push("Below 200 SMA"); rationale.push("Price below 200-day SMA confirms long-term downtrend."); }
  if (tech.adx > 25) { signals.push("Strong trend (ADX " + tech.adx + ")"); rationale.push("ADX above 25 signals a strong directional trend."); }
  if (fund.revenueGrowth > 15) rationale.push("Revenue growth of " + fund.revenueGrowth + "% supports fundamentals.");
  if (fund.debtToEquity > 2) rationale.push("High leverage (D/E " + fund.debtToEquity + ") is a concern.");
  if (fc.consensusScore > 10) rationale.push("Forecast consensus is bullish with " + fc.consensusScore + "% expected return.");
  if (fc.consensusScore < -10) rationale.push("Forecast consensus is bearish with " + fc.consensusScore + "% expected return.");

  const action = composite > 40 ? "Strong Buy" : composite > 15 ? "Buy" : composite < -40 ? "Strong Sell" : composite < -15 ? "Sell" : "Hold";
  const confidence = Math.min(0.95, 0.5 + Math.abs(composite) / 200);

  return {
    action,
    score: composite,
    confidence: round(confidence, 2),
    horizon: "3-6 months",
    rationale,
    technicalScore,
    fundamentalScore,
    forecastScore,
    riskScore,
    signals,
  };
}

function round(n: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
