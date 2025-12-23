
import React, { useState, useEffect, useMemo } from 'react';
import { generateGoldData, runBacktest } from './services/backtestEngine';
import { analyzeStrategy } from './services/geminiService';
import { Candle, StrategyParams, IndicatorVisibility, Timeframe, ChartSettings, DrawingObject, DrawingTool, TerminalState } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TradingViewChart from './components/TradingViewChart';
import LeftToolbar from './components/LeftToolbar';
import TopBar from './components/TopBar';
import RightSidebar from './components/RightSidebar';
import BottomPanel from './components/BottomPanel';
import { Play, SkipForward, Pause, RefreshCcw, Zap, Settings as Gear, X } from 'lucide-react';

const App: React.FC = () => {
  // UI State
  const [ui, setUi] = useState<TerminalState>({
    timeframe: '15m',
    activeTool: 'CURSOR',
    magnetMode: true,
    isRightSidebarOpen: true,
    bottomPanelTab: 'STRATEGY',
    isReplayMode: false,
    replayIndex: 500
  });

  // Data State
  const [fullData, setFullData] = useState<Candle[]>([]);
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [params, setParams] = useState<StrategyParams>({
    rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, smaPeriod: 50, emaPeriod: 20,
    initialBalance: 10000, stopLossPips: 50, takeProfitPips: 150, riskPercent: 1.0
  });

  const [indicatorVisibility, setIndicatorVisibility] = useState<IndicatorVisibility>({
    sma: true, rsi: true, pivots: true, zones: true
  });

  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    theme: 'dark',
    showVolume: true
  });

  const [visualSettings, setVisualSettings] = useState({
    upColor: '#22c55e', 
    downColor: '#ef4444', 
    showGridVert: true, 
    showGridHorz: true, 
    watermark: 'XAUUSD PRO', 
    rightOffset: 12
  });

  // Load Initial Data
  useEffect(() => {
    const data = generateGoldData(2000, ui.timeframe);
    setFullData(data);
    setUi(prev => ({ ...prev, replayIndex: 500 }));
  }, [ui.timeframe]);

  const visibleData = useMemo(() => {
    return ui.isReplayMode ? fullData.slice(0, ui.replayIndex) : fullData;
  }, [fullData, ui.replayIndex, ui.isReplayMode]);

  const backtestResults = useMemo(() => {
    return runBacktest(visibleData, params);
  }, [visibleData, params]);

  // Replay Player
  useEffect(() => {
    let interval: any;
    if (isPlaying && ui.isReplayMode && ui.replayIndex < fullData.length) {
      interval = setInterval(() => {
        setUi(prev => ({ ...prev, replayIndex: prev.replayIndex + 1 }));
      }, 300);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ui.isReplayMode, ui.replayIndex, fullData.length]);

  const handleAnalyzeResults = async () => {
    if (!backtestResults) return;
    setIsAnalyzing(true);
    try {
      const aiAnalysis = await analyzeStrategy(backtestResults, params);
      setAnalysis(aiAnalysis);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden flex flex-col font-sans select-none">
      {/* Top Navigation */}
      <TopBar 
        ui={ui} 
        setUi={(newUi: TerminalState) => setUi(newUi)} 
        isPlaying={isPlaying} 
        setIsPlaying={(p: boolean) => setIsPlaying(p)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls (Hidden in favor of TV layout, but state kept) */}
        <Sidebar 
          params={params} 
          setParams={setParams} 
          indicatorVisibility={indicatorVisibility} 
          setIndicatorVisibility={setIndicatorVisibility} 
        />

        {/* Drawing Tools Sidebar */}
        <LeftToolbar 
          activeTool={ui.activeTool} 
          setTool={(tool: DrawingTool) => setUi(prev => ({ ...prev, activeTool: tool }))}
          magnetMode={ui.magnetMode}
          toggleMagnet={() => setUi(prev => ({ ...prev, magnetMode: !prev.magnetMode }))}
        />

        {/* Core Charting Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#2a2e39]">
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-grid-pattern">
            <Dashboard 
              data={visibleData} 
              results={backtestResults} 
              analysis={analysis}
              params={params} 
              indicatorVisibility={indicatorVisibility}
              activeTool={ui.activeTool} 
              setActiveTool={(tool: DrawingTool) => setUi(prev => ({ ...prev, activeTool: tool }))}
              drawings={drawings} 
              setDrawings={setDrawings}
              chartSettings={chartSettings}
            />
          </div>
          
          {/* Bottom Panel */}
          <BottomPanel 
            tab={ui.bottomPanelTab} 
            setTab={(tab: 'STRATEGY' | 'LOG') => setUi(prev => ({ ...prev, bottomPanelTab: tab }))}
            results={backtestResults}
          />
        </div>

        {/* Watchlist & Details */}
        <RightSidebar 
          isOpen={ui.isRightSidebarOpen} 
          setOpen={(open: boolean) => setUi(prev => ({ ...prev, isRightSidebarOpen: open }))}
          currentPrice={visibleData[visibleData.length - 1]?.close || 0}
        />
      </div>
      
      {/* Status Bar */}
      <footer className="h-6 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-3 text-[10px] text-[#787b86]">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> Alpha Vantage Connected</span>
          <span>Bars: {visibleData.length}</span>
          <button onClick={handleAnalyzeResults} disabled={isAnalyzing} className="hover:text-white uppercase font-bold flex items-center gap-1">
            {isAnalyzing ? 'Analyzing...' : 'Run AI Review'}
          </button>
        </div>
        <div>UTC+0 | PRO ENGINE v5.2</div>
      </footer>
    </div>
  );
};

export default App;
