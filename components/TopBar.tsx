
import React from 'react';
import { Timeframe, TerminalState } from '../types';
import { Play, SkipForward, Pause, RotateCcw, Search, Settings, Layout, ChevronDown } from 'lucide-react';

interface Props {
  ui: TerminalState;
  setUi: (ui: TerminalState) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}

const TopBar: React.FC<Props> = ({ ui, setUi, isPlaying, setIsPlaying }) => {
  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <header className="h-12 bg-[#131722] border-b border-[#2a2e39] flex items-center px-4 justify-between z-50">
      <div className="flex items-center gap-1 border-r border-[#2a2e39] pr-4 h-full">
        <div className="flex items-center gap-2 hover:bg-[#2a2e39] p-1.5 rounded cursor-pointer transition-colors px-3">
          <span className="font-bold text-sm text-[#d1d4dc]">XAUUSD</span>
          <span className="text-[10px] text-[#787b86] font-mono">GOLD / USD</span>
          <ChevronDown size={14} className="text-[#787b86]" />
        </div>
      </div>

      <div className="flex-1 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex bg-[#2a2e39]/30 p-1 rounded-md">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setUi({ ...ui, timeframe: tf })}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                ui.timeframe === tf ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-[#2a2e39] mx-2" />
        
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#2a2e39] rounded text-[11px] font-bold text-[#d1d4dc]">
          <Search size={14} /> Indicators
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-[#1e222d] border border-[#2a2e39] rounded px-2 py-1">
          <button 
            onClick={() => setUi({ ...ui, isReplayMode: !ui.isReplayMode })}
            className={`p-1.5 rounded ${ui.isReplayMode ? 'text-[#2962ff]' : 'text-[#787b86]'} hover:bg-[#2a2e39]`}
            title="Bar Replay"
          >
            <RotateCcw size={16} />
          </button>
          
          {ui.isReplayMode && (
            <div className="flex items-center gap-1 border-l border-[#2a2e39] ml-1 pl-1 animate-in slide-in-from-left">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 text-[#d1d4dc] hover:bg-[#2a2e39] rounded">
                {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
              </button>
              <button onClick={() => setUi({...ui, replayIndex: ui.replayIndex + 1})} className="p-1.5 text-[#d1d4dc] hover:bg-[#2a2e39] rounded">
                <SkipForward size={14} />
              </button>
            </div>
          )}
        </div>

        <button className="p-2 text-[#787b86] hover:text-[#d1d4dc] transition-colors"><Layout size={18} /></button>
        <button className="p-2 text-[#787b86] hover:text-[#d1d4dc] transition-colors"><Settings size={18} /></button>
      </div>
    </header>
  );
};

export default TopBar;
