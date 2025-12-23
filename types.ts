
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type DrawingTool = 'CURSOR' | 'TRENDLINE' | 'RECTANGLE' | 'HLINE' | 'FIB' | 'TEXT' | 'ERASER';
export type DrawingToolType = DrawingTool;

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingObject {
  id: string;
  type: DrawingTool;
  points: DrawingPoint[];
  color: string;
  text?: string;
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
  // Add reason property for trade history
  reason?: string;
}

export interface TerminalState {
  timeframe: Timeframe;
  activeTool: DrawingTool;
  magnetMode: boolean;
  isRightSidebarOpen: boolean;
  bottomPanelTab: 'STRATEGY' | 'LOG';
  isReplayMode: boolean;
  replayIndex: number;
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

export interface BacktestResults {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  trades: Trade[];
  finalBalance: number;
  maxDrawdown: number;
  equityCurve: { time: number; value: number }[];
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
}

export interface IndicatorVisibility {
  sma: boolean;
  rsi: boolean;
  pivots: boolean;
  zones: boolean;
}

export interface ChartSettings {
  theme: 'dark' | 'light';
  showVolume: boolean;
}
