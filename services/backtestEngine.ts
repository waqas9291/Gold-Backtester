
import { RSI, SMA, EMA } from 'technicalindicators';
import { Candle, StrategyParams, BacktestResults, Trade, PivotPoints, SDZone, Timeframe } from '../types';

// Fix: Update keys to match Timeframe type '1m', '5m', etc.
const TIMEFRAME_TO_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

export const runBacktest = (
  data: Candle[],
  params: StrategyParams
): BacktestResults => {
  if (data.length < params.smaPeriod) {
    return { totalTrades: 0, winRate: 0, totalProfit: 0, trades: [], finalBalance: params.initialBalance, maxDrawdown: 0, equityCurve: [] };
  }
  
  const prices = data.map(c => c.close);
  
  const rsiValues = RSI.calculate({ values: prices, period: params.rsiPeriod });
  const smaValues = SMA.calculate({ values: prices, period: params.smaPeriod });
  const emaValues = EMA.calculate({ values: prices, period: params.emaPeriod });
  
  const pad = (arr: any[], targetLen: number, startFill: any = null) => 
    Array(targetLen - arr.length).fill(startFill).concat(arr);

  const paddedRsi = pad(rsiValues, data.length);
  const paddedSma = pad(smaValues, data.length);
  const paddedEma = pad(emaValues, data.length);

  let balance = params.initialBalance;
  const trades: Trade[] = [];
  let currentTrade: Trade | null = null;
  const equityCurve: { time: number; value: number }[] = [{ time: data[0].time, value: balance }];

  for (let i = 1; i < data.length; i++) {
    const candle = data[i];
    const rsi = paddedRsi[i];
    const sma = paddedSma[i];
    const ema = paddedEma[i];

    if (currentTrade) {
      const pips = currentTrade.type === 'LONG' 
        ? (candle.close - currentTrade.entryPrice) * 100 
        : (currentTrade.entryPrice - candle.close) * 100;

      let shouldExit = false;
      let reason = "";

      if (pips <= -params.stopLossPips) {
        shouldExit = true;
        reason = "Stop Loss";
      } else if (pips >= params.takeProfitPips) {
        shouldExit = true;
        reason = "Take Profit";
      } else if (currentTrade.type === 'LONG' && candle.close < ema) {
        shouldExit = true;
        reason = "Trend Exit";
      } else if (currentTrade.type === 'SHORT' && candle.close > ema) {
        shouldExit = true;
        reason = "Trend Exit";
      }

      if (shouldExit) {
        const exitPrice = candle.close;
        const profit = (currentTrade.type === 'LONG' ? (exitPrice - currentTrade.entryPrice) : (currentTrade.entryPrice - exitPrice)) * 50;
        balance += profit;
        
        trades.push({
          ...currentTrade,
          exitPrice,
          exitTime: candle.time,
          profit,
          status: 'CLOSED',
          reason // Now valid as reason is added to Trade type
        });
        currentTrade = null;
        equityCurve.push({ time: candle.time, value: balance });
      }
    }

    if (!currentTrade && rsi !== null && sma !== null && ema !== null) {
      if (candle.close > sma && rsi < params.rsiOversold) {
        currentTrade = {
          id: `T-${i}`,
          type: 'LONG',
          entryPrice: candle.close,
          entryTime: candle.time,
          status: 'OPEN',
          exitPrice: 0,
          exitTime: 0,
          profit: 0
        };
      }
      else if (candle.close < sma && rsi > params.rsiOverbought) {
        currentTrade = {
          id: `T-${i}`,
          type: 'SHORT',
          entryPrice: candle.close,
          entryTime: candle.time,
          status: 'OPEN',
          exitPrice: 0,
          exitTime: 0,
          profit: 0
        };
      }
    }
  }

  const winRate = trades.length > 0 ? (trades.filter(t => t.profit > 0).length / trades.length) * 100 : 0;
  
  let peak = params.initialBalance;
  let maxDD = 0;
  equityCurve.forEach(e => {
    if (e.value > peak) peak = e.value;
    const dd = ((peak - e.value) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
  });

  return {
    totalTrades: trades.length,
    winRate,
    totalProfit: balance - params.initialBalance,
    trades,
    finalBalance: balance,
    maxDrawdown: maxDD,
    equityCurve
  };
};

export const calculatePivotPoints = (data: Candle[]): PivotPoints | null => {
  if (data.length < 50) return null;
  const slice = data.slice(-100);
  const h = Math.max(...slice.map(c => c.high));
  const l = Math.min(...slice.map(c => c.low));
  const c = slice[slice.length - 1].close;

  const p = (h + l + c) / 3;
  return {
    p,
    r1: 2 * p - l,
    r2: p + (h - l),
    s1: 2 * p - h,
    s2: p - (h - l),
  };
};

export const detectSupplyDemandZones = (data: Candle[]): SDZone[] => {
  const zones: SDZone[] = [];
  const lookback = 5;
  if (data.length < lookback + 10) return [];
  
  for (let i = lookback; i < data.length - 5; i++) {
    const prevRange = Math.max(...data.slice(i - lookback, i).map(c => c.high)) - Math.min(...data.slice(i - lookback, i).map(c => c.low));
    const volatility = prevRange / lookback;
    const futureMove = data[i+3].close - data[i].close;

    if (futureMove > volatility * 8) {
      zones.push({
        type: 'DEMAND',
        priceStart: Math.min(data[i].low, data[i-1].low),
        priceEnd: Math.max(data[i].high, data[i-1].high),
        timeStart: data[i].time,
      });
    } else if (futureMove < -volatility * 8) {
      zones.push({
        type: 'SUPPLY',
        priceStart: Math.min(data[i].low, data[i-1].low),
        priceEnd: Math.max(data[i].high, data[i-1].high),
        timeStart: data[i].time,
      });
    }
  }
  return zones.slice(-3); 
};

// Fix: Change 'M15' to '15m' to match Timeframe type
export const generateGoldData = (count: number, timeframe: Timeframe = '15m'): Candle[] => {
  const data: Candle[] = [];
  let price = 2100.0;
  const interval = TIMEFRAME_TO_SECONDS[timeframe];
  let time = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000);

  // Volatility scales with sqrt of time
  const timeframeMultiplier = Math.sqrt(interval / 900);

  for (let i = 0; i < count; i++) {
    const date = new Date(time * 1000);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();

    // Skip weekends
    if (day === 5 && hour >= 22) {
      time += (48 + (24 - hour)) * 3600; 
      price += (Math.random() - 0.5) * 12 * timeframeMultiplier;
    }

    let volMult = 1.0;
    if (hour >= 13 && hour <= 17) volMult = 2.4; // NY
    else if (hour >= 8 && hour < 13) volMult = 1.6; // London
    else if (hour > 17 && hour < 21) volMult = 1.4; // NY late
    else if (hour >= 0 && hour < 7) volMult = 0.7; // Asia
    else volMult = 0.5;

    const baseVolatility = (0.8 + Math.random() * 1.5) * timeframeMultiplier;
    const sessionVolatility = baseVolatility * volMult;
    const cycleTrend = Math.sin(i / (150 / timeframeMultiplier)) * 0.4;
    
    const open = price;
    const change = (Math.random() - 0.5 + cycleTrend) * sessionVolatility;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (sessionVolatility * 0.6);
    const low = Math.min(open, close) - Math.random() * (sessionVolatility * 0.6);

    data.push({ time, open, high, low, close, volume: Math.random() * 8000 * volMult * timeframeMultiplier });
    price = close;
    time += interval;
  }
  return data;
};
