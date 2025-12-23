
export interface Candle {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  profit: number;
  status: 'OPEN' | 'CLOSED';
  reason?: string;
}

export interface BacktestResults {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  trades: Trade[];
  finalBalance: number;
  maxDrawdown: number;
  equityCurve: { time: number; value: number }[];
}

export interface StrategyParams {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  smaPeriod: number;
  emaPeriod: number;
  initialBalance: number;
  stopLossPips: number;
  takeProfitPips: number;
  riskPercent: number;
}

export interface IndicatorVisibility {
  sma: boolean;
  ema: boolean;
  rsi: boolean;
  bollinger: boolean;
  macd: boolean;
  pivots: boolean;
  zones: boolean;
}

export type DrawingToolType = 'NONE' | 'TRENDLINE' | 'RECTANGLE' | 'HLINE';

export interface DrawingObject {
  id: string;
  type: DrawingToolType;
  points: { time: number; price: number }[];
  color: string;
}

export interface PivotPoints {
  p: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

export interface SDZone {
  type: 'SUPPLY' | 'DEMAND';
  priceStart: number;
  priceEnd: number;
  timeStart: number;
  timeEnd?: number; // Ongoing if undefined
}
