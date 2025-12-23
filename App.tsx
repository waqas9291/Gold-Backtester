
import React, { useState, useEffect, useMemo } from 'react';
import { generateGoldData, runBacktest } from './services/backtestEngine';
import { analyzeStrategy } from './services/geminiService';
import { Candle, StrategyParams, IndicatorVisibility } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Play, SkipForward, Pause, RefreshCcw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [fullData] = useState<Candle[]>(() => generateGoldData(1500));
  const [replayIndex, setReplayIndex] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [params, setParams] = useState<StrategyParams>({
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    smaPeriod: 50,
    emaPeriod: 20,
    initialBalance: 10000,
    stopLossPips: 50,
    takeProfitPips: 150,
    riskPercent: 1.0
  });

  const [indicatorVisibility, setIndicatorVisibility] = useState<IndicatorVisibility>({
    sma: true,
    ema: true,
    rsi: true,
    bollinger: false,
    macd: false,
    pivots: true,
    zones: true
  });

  const visibleData = useMemo(() => fullData.slice(0, replayIndex), [fullData, replayIndex]);
  const results = useMemo(() => runBacktest(visibleData, params), [visibleData, params]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && replayIndex < fullData.length) {
      interval = setInterval(() => {
        setReplayIndex(prev => prev + 1);
      }, 100);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayIndex, fullData.length]);

  const handleAnalyzeResults = async () => {
    if (!results) return;
    setIsAnalyzing(true);
    try {
      const aiAnalysis = await analyzeStrategy(results, params);
      setAnalysis(aiAnalysis);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        params={params} 
        setParams={setParams} 
        indicatorVisibility={indicatorVisibility} 
        setIndicatorVisibility={setIndicatorVisibility} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#10141b]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-yellow-500 italic uppercase tracking-tighter">XAUUSD.PRO</h1>
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-2 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
              <span className="text-xs font-bold text-slate-400">MARKET STATUS</span>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#161b22] p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => {
                  setReplayIndex(200);
                  setAnalysis('');
                }}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                title="Reset Replay"
              >
                <RefreshCcw size={18} />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-slate-100 hover:bg-white text-black font-bold rounded-lg flex items-center gap-2 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
                {isPlaying ? 'PAUSE' : 'REPLAY'}
              </button>
              <button 
                onClick={() => setReplayIndex(prev => Math.min(prev + 1, fullData.length))}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                title="Step Forward"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <button 
              onClick={handleAnalyzeResults}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed transition-all rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20"
            >
              <Zap className={`w-4 h-4 fill-current ${isAnalyzing ? 'animate-pulse text-yellow-400' : ''}`} />
              {isAnalyzing ? 'Processing...' : 'AI Quant Review'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Dashboard 
            data={visibleData} 
            results={results} 
            analysis={analysis}
            params={params}
            indicatorVisibility={indicatorVisibility}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
