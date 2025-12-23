
import React, { useState, useEffect, useMemo } from 'react';
import { generateGoldData, runBacktest } from './services/backtestEngine';
import { analyzeStrategy } from './services/geminiService';
import { Candle, StrategyParams, IndicatorVisibility, Timeframe, ChartSettings, DrawingObject, DrawingToolType } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Play, SkipForward, Pause, RefreshCcw, Zap, Settings as Gear, X } from 'lucide-react';

const App: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [fullData, setFullData] = useState<Candle[]>(() => generateGoldData(1500, timeframe));
  const [replayIndex, setReplayIndex] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Persistent Drawing State
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingToolType>('NONE');

  const [params, setParams] = useState<StrategyParams>({
    rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, smaPeriod: 50, emaPeriod: 20,
    initialBalance: 10000, stopLossPips: 50, takeProfitPips: 150, riskPercent: 1.0
  });

  const [indicatorVisibility, setIndicatorVisibility] = useState<IndicatorVisibility>({
    sma: true, ema: true, rsi: true, bollinger: false, macd: false, pivots: true, zones: true, sessions: true
  });

  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    upColor: '#22c55e', downColor: '#ef4444', showGridVert: true, showGridHorz: true, watermark: 'XAUUSD PRO', rightOffset: 12
  });

  useEffect(() => {
    setFullData(generateGoldData(1500, timeframe));
    setReplayIndex(200);
    setIsPlaying(false);
  }, [timeframe]);

  const visibleData = useMemo(() => fullData.slice(0, replayIndex), [fullData, replayIndex]);
  const results = useMemo(() => runBacktest(visibleData, params), [visibleData, params]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && replayIndex < fullData.length) {
      interval = setInterval(() => setReplayIndex(prev => prev + 1), 100);
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
    <div className="flex h-screen bg-[#0b0e14] text-slate-100 overflow-hidden font-sans select-none">
      <Sidebar 
        params={params} setParams={setParams} 
        indicatorVisibility={indicatorVisibility} setIndicatorVisibility={setIndicatorVisibility} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#10141b]/95 backdrop-blur-xl sticky top-0 z-30 shadow-xl">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black text-yellow-500 italic tracking-tighter cursor-default">XAUUSD.PRO</h1>
            
            <div className="h-4 w-px bg-slate-800"></div>
            
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
              {(['M1', 'M5', 'M15', 'H1', 'H4', 'D1'] as Timeframe[]).map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-[10px] font-black transition-all ${timeframe === tf ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
              <button onClick={() => { setReplayIndex(200); setAnalysis(''); }} className="p-2 hover:bg-slate-800 rounded text-slate-400 transition-colors"><RefreshCcw size={16} /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className={`px-4 py-1.5 rounded text-[10px] font-black flex items-center gap-2 transition-all ${isPlaying ? 'bg-red-600' : 'bg-slate-100 text-black'}`}>
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />} {isPlaying ? 'STOP' : 'PLAY'}
              </button>
            </div>

            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Gear size={18} /></button>

            <button onClick={handleAnalyzeResults} disabled={isAnalyzing} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">
              <Zap className={`w-3.5 h-3.5 fill-current ${isAnalyzing ? 'animate-pulse text-yellow-400' : ''}`} /> {isAnalyzing ? '...' : 'AI QUANT'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-grid-pattern">
          <Dashboard 
            data={visibleData} results={results} analysis={analysis}
            params={params} indicatorVisibility={indicatorVisibility}
            activeTool={activeTool} setActiveTool={setActiveTool}
            drawings={drawings} setDrawings={setDrawings}
            chartSettings={chartSettings}
          />
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all">
            <div className="w-80 bg-[#10141b] h-full border-l border-slate-800 p-8 shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Chart Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-3 uppercase">Candle Themes</label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 rounded border border-slate-800 bg-slate-900 flex items-center justify-center gap-2 cursor-pointer" onClick={() => setChartSettings({...chartSettings, upColor: '#22c55e', downColor: '#ef4444'})}>
                      <div className="w-3 h-3 bg-[#22c55e] rounded-sm"></div> <div className="w-3 h-3 bg-[#ef4444] rounded-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                   <SettingToggle label="Vertical Grid" active={chartSettings.showGridVert} onClick={() => setChartSettings({...chartSettings, showGridVert: !chartSettings.showGridVert})} />
                   <SettingToggle label="Horizontal Grid" active={chartSettings.showGridHorz} onClick={() => setChartSettings({...chartSettings, showGridHorz: !chartSettings.showGridHorz})} />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-2 uppercase">Right Offset (Bars)</label>
                  <input type="range" min="0" max="50" value={chartSettings.rightOffset} onChange={(e) => setChartSettings({...chartSettings, rightOffset: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SettingToggle = ({ label, active, onClick }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800">
    <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-4.5' : 'left-0.5'}`}></div>
    </div>
  </div>
);

export default App;
