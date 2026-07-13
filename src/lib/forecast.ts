import type { Candle, Fundamentals } from "./types";
import type { TechnicalSummary, FundamentalScore } from "./indicators";

export interface Forecast {
  period: string;
  targetPrice: number;
  low: number;
  high: number;
  confidence: number;
}

export interface ForecastSet {
  short: Forecast;
  medium: Forecast;
  long: Forecast;
  trendDirection: string;
  expectedReturn: number;
}

export interface Recommendation {
  action: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  targetPrice: number;
  stopLoss: number;
  riskLevel: "Low" | "Medium" | "High";
  timeHorizon: string;
  confidence: number;
  rationale: string[];
}

export function forecast(candles: Candle[], _fund: Fundamentals, tech: TechnicalSummary): ForecastSet {
  const closes = candles.map((c) => c.c);
  const lastPrice = closes[closes.length - 1];
  const n = closes.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) { sumX += i; sumY += closes[i]; sumXY += i * closes[i]; sumXX += i * i; }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const momentum = tech.rsi > 55 ? 1.05 : tech.rsi < 45 ? 0.95 : 1;
  const volatility = (tech.atr / lastPrice) || 0.02;
  const shortTarget = (intercept + slope * n * 1.2) * momentum;
  const mediumTarget = (intercept + slope * n * 2) * momentum;
  const longTarget = (intercept + slope * n * 4) * momentum;
  const conf = Math.max(0.3, Math.min(0.95, 0.5 + (tech.trend === "Bullish" ? 0.2 : tech.trend === "Bearish" ? -0.2 : 0) + (tech.momentum === "Strong" ? 0.15 : 0)));
  const expectedReturn = ((shortTarget - lastPrice) / lastPrice) * 100;
  return {
    short: { period: "1-3 months", targetPrice: shortTarget, low: shortTarget * (1 - volatility * 2), high: shortTarget * (1 + volatility * 2), confidence: conf },
    medium: { period: "3-6 months", targetPrice: mediumTarget, low: mediumTarget * (1 - volatility * 3), high: mediumTarget * (1 + volatility * 3), confidence: conf * 0.9 },
    long: { period: "6-12 months", targetPrice: longTarget, low: longTarget * (1 - volatility * 4), high: longTarget * (1 + volatility * 4), confidence: conf * 0.8 },
    trendDirection: slope > 0 ? "Upward" : slope < 0 ? "Downward" : "Sideways",
    expectedReturn,
  };
}

export function recommend(tech: TechnicalSummary, fundGrade: string, fc: ForecastSet): Recommendation {
  const score = (tech.rsi < 30 ? 2 : tech.rsi > 70 ? -1 : 0) + (tech.trend === "Bullish" ? 2 : tech.trend === "Bearish" ? -2 : 0) + (fc.expectedReturn > 10 ? 2 : fc.expectedReturn < -10 ? -2 : 0) + (fundGrade.startsWith("A") ? 2 : fundGrade.startsWith("B") ? 1 : fundGrade.startsWith("C") ? 0 : -1);
  let action: Recommendation["action"] = "Hold";
  if (score >= 4) action = "Strong Buy";
  else if (score >= 2) action = "Buy";
  else if (score <= -3) action = "Strong Sell";
  else if (score <= -1) action = "Sell";
  const lastPrice = fc.short.targetPrice / (1 + fc.expectedReturn / 100);
  const rationale: string[] = [];
  if (tech.trend === "Bullish") rationale.push("Price is trading above key moving averages, indicating bullish momentum.");
  if (tech.trend === "Bearish") rationale.push("Price is below key moving averages, signaling bearish pressure.");
  if (tech.rsi < 30) rationale.push("RSI is in oversold territory, suggesting a potential reversal.");
  if (tech.rsi > 70) rationale.push("RSI is overbought, suggesting caution for new entries.");
  if (fundGrade.startsWith("A")) rationale.push("Strong fundamentals with solid profitability and growth metrics.");
  if (fundGrade.startsWith("D") || fundGrade === "F") rationale.push("Weak fundamentals require caution.");
  if (fc.expectedReturn > 15) rationale.push(`Forecasted return of ${fc.expectedReturn.toFixed(1)}% over the short term.`);
  rationale.push(`Volatility is ${tech.volatility.toLowerCase()}, with ATR at ${tech.atr.toFixed(2)}.`);
  return {
    action, targetPrice: fc.short.targetPrice, stopLoss: lastPrice * 0.92,
    riskLevel: tech.volatility === "High" ? "High" : tech.volatility === "Medium" ? "Medium" : "Low",
    timeHorizon: fc.short.period, confidence: fc.short.confidence, rationale,
  };
}
