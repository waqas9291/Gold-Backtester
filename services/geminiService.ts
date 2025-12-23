
import { GoogleGenAI } from "@google/genai";
import { BacktestResults, StrategyParams } from "../types";

export const analyzeStrategy = async (results: BacktestResults, params: StrategyParams): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    As a senior quantitative analyst, evaluate this XAUUSD (Gold) backtesting result.
    Strategy Parameters:
    - RSI Period: ${params.rsiPeriod}
    - RSI Overbought/Oversold: ${params.rsiOverbought}/${params.rsiOversold}
    - SMA Period: ${params.smaPeriod}
    - Initial Balance: $${params.initialBalance}

    Performance Metrics:
    - Total Trades: ${results.totalTrades}
    - Win Rate: ${results.winRate.toFixed(2)}%
    - Total Profit: $${results.totalProfit.toFixed(2)}
    - Final Balance: $${results.finalBalance.toFixed(2)}
    - Max Drawdown: ${results.maxDrawdown.toFixed(2)}%

    Provide a concise analysis (max 300 words) focusing on risk management, strategy robustness, and potential improvements. Use a professional tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to connect to AI analysis engine.";
  }
};
