
import React, { useState, useEffect, useReducer, useMemo } from 'react';
import { generateGoldData, runBacktest } from './services/backtestEngine';
import { Candle, Timeframe, DrawingTool, DrawingObject, Trade, TerminalState } from './types';
import TradingViewChart from './components/TradingViewChart';
import LeftToolbar from './components/LeftToolbar';
import TopBar from './components/TopBar';
import RightSidebar from './components/RightSidebar';
import BottomPanel from './components/BottomPanel';
import { Zap } from 'lucide-react';

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

  // Load Initial Data
  useEffect(() => {
    const data = generateGoldData(2000, ui.timeframe);
    setFullData(data);
  }, [ui.timeframe]);

  const visibleData = useMemo(() => {
    return ui.isReplayMode ? fullData.slice(0, ui.replayIndex) : fullData;
  }, [fullData, ui.replayIndex, ui.isReplayMode]);

  const backtestResults = useMemo(() => {
    return runBacktest(visibleData, {
      rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, smaPeriod: 50, emaPeriod: 20,
      initialBalance: 10000, stopLossPips: 40, takeProfitPips: 120, riskPercent: 1.0
    });
  }, [visibleData]);

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

  return (
    <div className="h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden flex flex-col font-sans select-none">
      {/* Top Navigation */}
      <TopBar 
        ui={ui} 
        setUi={setUi} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Drawing Tools Sidebar */}
        <LeftToolbar 
          activeTool={ui.activeTool} 
          setTool={(tool) => setUi(prev => ({ ...prev, activeTool: tool }))}
          magnetMode={ui.magnetMode}
          toggleMagnet={() => setUi(prev => ({ ...prev, magnetMode: !prev.magnetMode }))}
        />

        {/* Core Charting Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#2a2e39]">
          <div className="flex-1 relative">
            <TradingViewChart 
              data={visibleData}
              trades={backtestResults.trades}
              drawings={drawings}
              setDrawings={setDrawings}
              activeTool={ui.activeTool}
              magnetMode={ui.magnetMode}
              timeframe={ui.timeframe}
            />
          </div>
          
          {/* Resizable Bottom Panel */}
          <BottomPanel 
            tab={ui.bottomPanelTab} 
            setTab={(tab) => setUi(prev => ({ ...prev, bottomPanelTab: tab }))}
            results={backtestResults}
          />
        </div>

        {/* Watchlist & Details */}
        <RightSidebar 
          isOpen={ui.isRightSidebarOpen} 
          setOpen={(open) => setUi(prev => ({ ...prev, isRightSidebarOpen: open }))}
          currentPrice={visibleData[visibleData.length - 1]?.close || 0}
        />
      </div>
      
      {/* Status Bar */}
      <footer className="h-6 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-3 text-[10px] text-[#787b86]">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> Alpha Vantage Connected</span>
          <span>Bars: {visibleData.length}</span>
        </div>
        <div>UTC+0 | PRO ENGINE v5.2</div>
      </footer>
    </div>
  );
};

export default App;
