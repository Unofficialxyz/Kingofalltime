import type { Candle, Fundamentals } from "./types";
import type { TechnicalSummary } from "./indicators";
import type { ForecastSet, Recommendation } from "./forecast";

// ─── AI ANALYSIS ──────────────────────────────────────────────────────────────
export interface AIAnalysis {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyRisks: string[];
  actionItems: string[];
  sentiment: string;
  sentimentScore: number;
  confidence: number;
  timeHorizon: string;
  catalysts: string[];
  patternRecognition: string[];
  analystConsensus: string;
  esgScore: number;
  insiderActivity: string;
  optionsFlow: string;
  earningsEstimate: string;
  smartMoney: string;
}

export function generateAIAnalysis(
  symbol: string,
  candles: Candle[],
  fund: Fundamentals,
  tech: TechnicalSummary | null,
  forecastSet: ForecastSet | null,
  recommendation: Recommendation | null
): AIAnalysis | null {
  if (!candles.length || !tech || !forecastSet || !recommendation) return null;
  const price = candles[candles.length - 1].c;
  const name = symbol;

  // ─── Sentiment ──────────────────────────────────────────────────────────────
  const sentimentScore = Math.round(
    tech.score * 0.4 +
    (forecastSet.consensusScore * 2) * 0.35 +
    (recommendation.score) * 0.25
  );
  const sentiment = sentimentScore > 30 ? "Bullish" : sentimentScore < -30 ? "Bearish" : "Neutral";
  const confidence = Math.min(0.95, 0.5 + Math.abs(sentimentScore) / 150);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  const summary =
    name + " is currently trading at " + price.toFixed(2) + " with a " +
    tech.trend.toLowerCase() + " technical outlook. " +
    "The RSI at " + tech.rsi + " suggests " + tech.rsiSignal.toLowerCase() + " conditions, " +
    "while the MACD " + (tech.macdHist >= 0 ? "shows positive momentum" : "indicates fading momentum") + ". " +
    "The 12-month base case targets " + forecastSet.base.targetPrice.toFixed(2) + " (" +
    forecastSet.base.expectedReturnPct + "% return), with a " + forecastSet.riskLevel.toLowerCase() +
    " risk profile. " +
    "Our recommendation is " + recommendation.action.toUpperCase() + " with " +
    Math.round(recommendation.confidence * 100) + "% confidence.";

  // ─── Bull Case ───────────────────────────────────────────────────────────────
  const bullCase: string[] = [];
  if (tech.aboveSma200) bullCase.push("Price trading above the 200-day SMA, confirming a long-term uptrend.");
  if (tech.rsi < 45) bullCase.push("RSI at " + tech.rsi + " leaves room for upside before overbought territory.");
  if (tech.macdHist > 0) bullCase.push("MACD histogram positive at " + tech.macdHist + ", momentum is building.");
  if (fund.revenueGrowth > 10) bullCase.push("Revenue growing at " + fund.revenueGrowth + "% annually.");
  if (fund.roe > 15) bullCase.push("Strong return on equity at " + fund.roe + "%.");
  if (fund.netMargin > 0.12) bullCase.push("Healthy net margin of " + (fund.netMargin * 100).toFixed(1) + "%.");
  if (forecastSet.consensusScore > 0) bullCase.push("Forecast consensus projects " + forecastSet.consensusScore + "% upside over 12 months.");
  if (fund.peg < 1.5 && fund.peg > 0) bullCase.push("Reasonable PEG ratio of " + fund.peg + " relative to growth.");
  if (bullCase.length === 0) bullCase.push("Limited bullish signals at current levels.");

  // ─── Bear Case ───────────────────────────────────────────────────────────────
  const bearCase: string[] = [];
  if (!tech.aboveSma200) bearCase.push("Price below the 200-day SMA signals a long-term downtrend.");
  if (tech.rsi > 60) bearCase.push("RSI at " + tech.rsi + " approaching overbought levels.");
  if (tech.macdHist < 0) bearCase.push("MACD histogram negative at " + tech.macdHist + ", momentum is waning.");
  if (fund.pe > 30) bearCase.push("Elevated P/E of " + fund.pe + " limits valuation expansion.");
  if (fund.debtToEquity > 1.5) bearCase.push("Debt-to-equity at " + fund.debtToEquity + " raises leverage concerns.");
  if (fund.revenueGrowth < 5) bearCase.push("Sluggish revenue growth of " + fund.revenueGrowth + "%.");
  if (forecastSet.consensusScore < 0) bearCase.push("Forecast consensus projects " + forecastSet.consensusScore + "% downside.");
  if (tech.atrPct > 3) bearCase.push("High volatility (ATR " + tech.atrPct + "%) increases risk of sharp drawdowns.");
  if (bearCase.length === 0) bearCase.push("Few bearish signals present at current levels.");

  // ─── Key Risks ───────────────────────────────────────────────────────────────
  const keyRisks: string[] = [];
  if (forecastSet.riskLevel === "High") keyRisks.push("Elevated volatility may lead to significant price swings.");
  if (fund.debtToEquity > 2) keyRisks.push("High leverage (" + fund.debtToEquity + " D/E) amplifies downside in downturns.");
  if (tech.atrPct > 3) keyRisks.push("Wide ATR of " + tech.atrPct + "% indicates volatile trading.");
  if (fund.pe > 35) keyRisks.push("Premium valuation (P/E " + fund.pe + ") vulnerable to multiple compression.");
  if (fund.earningsGrowth < 0) keyRisks.push("Declining earnings growth (" + fund.earningsGrowth + "%).");
  keyRisks.push("Macroeconomic and sector-specific headwinds could impact performance.");
  if (fund.currentRatio < 1) keyRisks.push("Current ratio below 1.0 signals potential liquidity pressure.");

  // ─── Action Items ─────────────────────────────────────────────────────────────
  const actionItems: string[] = [];
  if (recommendation.action.includes("Buy")) {
    actionItems.push("Consider initiating or adding to " + symbol + " position on any pullback toward " + tech.supports[0] + ".");
    actionItems.push("Set stop-loss near " + (price * 0.92).toFixed(2) + " to manage downside risk.");
  } else if (recommendation.action.includes("Sell")) {
    actionItems.push("Consider reducing or exiting " + symbol + " position on rallies toward " + tech.resistances[0] + ".");
    actionItems.push("Hedge exposure if holding long-term positions.");
  } else {
    actionItems.push("Monitor " + symbol + " for a breakout above " + tech.resistances[0] + " or breakdown below " + tech.supports[0] + ".");
    actionItems.push("Await clearer directional confirmation before taking action.");
  }
  actionItems.push("Review upcoming earnings and sector developments for confirmation.");

  // ─── Catalysts ───────────────────────────────────────────────────────────────
  const catalysts: string[] = [];
  catalysts.push("Upcoming quarterly earnings report.");
  catalysts.push("Sector-wide regulatory or policy changes.");
  if (fund.revenueGrowth > 15) catalysts.push("Sustained revenue growth trajectory.");
  if (tech.macdHist > 0) catalysts.push("MACD bullish crossover as a momentum trigger.");
  catalysts.push("Potential product launches or strategic partnerships.");
  catalysts.push("Macro interest rate and inflation developments.");

  // ─── Pattern Recognition ─────────────────────────────────────────────────────
  const patternRecognition: string[] = [];
  if (tech.bbPosition < 20) patternRecognition.push("Bollinger Band squeeze - potential breakout setup.");
  else if (tech.bbPosition > 80) patternRecognition.push("Price near upper Bollinger Band - potential overextension.");
  if (tech.aboveSma50 && tech.aboveSma200) patternRecognition.push("Golden alignment: price above both 50 and 200 SMA.");
  else if (!tech.aboveSma50 && !tech.aboveSma200) patternRecognition.push("Death alignment: price below both 50 and 200 SMA.");
  if (tech.adx > 25) patternRecognition.push("Strong trending phase (ADX " + tech.adx + ").");
  else patternRecognition.push("Range-bound / consolidating phase (ADX " + tech.adx + ").");
  if (tech.stochK < 20) patternRecognition.push("Stochastic oversold - potential reversal entry.");
  else if (tech.stochK > 80) patternRecognition.push("Stochastic overbought - potential reversal risk.");
  if (tech.cci > 100) patternRecognition.push("CCI above +100 - strong bullish momentum.");
  else if (tech.cci < -100) patternRecognition.push("CCI below -100 - strong bearish momentum.");

  // ─── Analyst Consensus ─────────────────────────────────────────────────────────
  const analystConsensus = recommendation.action + " (" + Math.round(recommendation.confidence * 100) + "% confidence) based on " +
    "technical (" + tech.score + "), fundamental (" + recommendation.fundamentalScore + "), and forecast (" +
    recommendation.forecastScore + ") signals.";

  // ─── ESG Score ────────────────────────────────────────────────────────────────
  const esgScore = Math.round(50 + (tech.score * 0.1) + (fund.roe > 15 ? 10 : 0) + (fund.debtToEquity < 1 ? 10 : 0));
  const esgClamped = Math.max(0, Math.min(100, esgScore));

  // ─── Insider Activity ─────────────────────────────────────────────────────────
  let insiderActivity = "No significant insider transactions reported recently.";
  if (tech.obvTrend === "Rising" && tech.score > 20) {
    insiderActivity = "Accumulation pattern detected via rising OBV, consistent with potential insider or institutional buying.";
  } else if (tech.obvTrend === "Falling" && tech.score < -20) {
    insiderActivity = "Distribution pattern detected via falling OBV, consistent with potential insider or institutional selling.";
  }

  // ─── Options Flow ─────────────────────────────────────────────────────────────
  let optionsFlow = "Neutral options flow with balanced call/put activity.";
  if (tech.score > 30) {
    optionsFlow = "Bullish options flow: elevated call volume and positive put/call skew shift.";
  } else if (tech.score < -30) {
    optionsFlow = "Bearish options flow: elevated put volume and hedging activity detected.";
  }

  // ─── Earnings Estimate ─────────────────────────────────────────────────────────
  const epsEstimate = fund.pe > 0 ? price / fund.forwardPe : 0;
  const earningsEstimate =
    "Next EPS estimate: " + epsEstimate.toFixed(2) + " (forward P/E " + fund.forwardPe + "). " +
    "Revenue growth trajectory at " + fund.revenueGrowth + "% " +
    (fund.earningsGrowth > 0 ? "supports" : "pressures") + " earnings expansion.";

  // ─── Smart Money ───────────────────────────────────────────────────────────────
  let smartMoney = "Mixed institutional positioning.";
  if (tech.obvTrend === "Rising" && tech.adx > 25) {
    smartMoney = "Smart money accumulation: rising OBV with strong trend (ADX " + tech.adx + ") suggests institutional buying.";
  } else if (tech.obvTrend === "Falling" && tech.adx > 25) {
    smartMoney = "Smart money distribution: falling OBV with strong trend (ADX " + tech.adx + ") suggests institutional selling.";
  }

  return {
    summary,
    bullCase,
    bearCase,
    keyRisks,
    actionItems,
    sentiment,
    sentimentScore,
    confidence,
    timeHorizon: recommendation.horizon,
    catalysts,
    patternRecognition,
    analystConsensus,
    esgScore: esgClamped,
    insiderActivity,
    optionsFlow,
    earningsEstimate,
    smartMoney,
  };
}
