
import { RSI, SMA, EMA } from 'technicalindicators';
import { Candle, StrategyParams, BacktestResults, Trade, PivotPoints, SDZone } from '../types';

export const runBacktest = (
  data: Candle[],
  params: StrategyParams
): BacktestResults => {
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
          reason
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
  // Use last 100 candles to simulate "Daily" range for this scale
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
  
  for (let i = lookback; i < data.length - 5; i++) {
    const prevRange = Math.max(...data.slice(i - lookback, i).map(c => c.high)) - Math.min(...data.slice(i - lookback, i).map(c => c.low));
    const currentMove = data[i+1].close - data[i].open;
    
    // Rally-Base-Drop or Drop-Base-Rally identification
    // If next 3 candles move significantly in one direction
    const futureMove = data[i+3].close - data[i].close;
    const volatility = prevRange / lookback;

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
  // Filter to keep only the most recent distinct zones
  return zones.slice(-3); 
};

export const generateGoldData = (count: number): Candle[] => {
  const data: Candle[] = [];
  let price = 2100.0;
  let time = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000);

  for (let i = 0; i < count; i++) {
    const date = new Date(time * 1000);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();

    if (day === 5 && hour >= 22) {
      time += (48 + (24 - hour)) * 3600; 
      price += (Math.random() - 0.5) * 12;
    }

    let volMult = 1.0;
    if (hour >= 13 && hour <= 17) volMult = 2.4;
    else if (hour >= 8 && hour < 13) volMult = 1.6;
    else if (hour > 17 && hour < 21) volMult = 1.4;
    else if (hour >= 0 && hour < 7) volMult = 0.7;
    else volMult = 0.5;

    const baseVolatility = 0.8 + Math.random() * 1.5;
    const sessionVolatility = baseVolatility * volMult;
    const cycleTrend = Math.sin(i / 150) * 0.4;
    const smallTrend = Math.cos(i / 20) * 0.2;
    
    const open = price;
    const change = (Math.random() - 0.5 + cycleTrend + smallTrend) * sessionVolatility;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (sessionVolatility * 0.6);
    const low = Math.min(open, close) - Math.random() * (sessionVolatility * 0.6);

    data.push({ time, open, high, low, close, volume: Math.random() * 8000 * volMult });
    price = close;
    time += 900;
  }
  return data;
};
