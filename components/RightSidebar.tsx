
import React from 'react';
import { PanelRightClose, PanelRightOpen, TrendingUp, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  setOpen: (o: boolean) => void;
  currentPrice: number;
}

const RightSidebar: React.FC<Props> = ({ isOpen, setOpen, currentPrice }) => {
  const watchlist = [
    { symbol: 'XAUUSD', name: 'Gold', price: currentPrice, change: '+1.2%' },
    { symbol: 'XAGUSD', name: 'Silver', price: 23.45, change: '-0.4%' },
    { symbol: 'BTCUSD', name: 'Bitcoin', price: 67240, change: '+2.1%' },
    { symbol: 'USOIL', name: 'WTI Crude', price: 78.12, change: '+0.8%' },
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="w-10 bg-[#131722] border-l border-[#2a2e39] flex justify-center py-4 text-[#787b86] hover:text-[#d1d4dc]"
      >
        <PanelRightOpen size={20} />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-[#131722] border-l border-[#2a2e39] flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#787b86]">Watchlist</h3>
        <button onClick={() => setOpen(false)} className="text-[#787b86] hover:text-[#d1d4dc]"><PanelRightClose size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {watchlist.map(item => (
          <div key={item.symbol} className="px-4 py-3 flex items-center justify-between hover:bg-[#2a2e39]/50 cursor-pointer group transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold group-hover:text-[#2962ff]">{item.symbol}</span>
              <span className="text-[10px] text-[#787b86]">{item.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-mono">${item.price.toFixed(2)}</span>
              <span className={`text-[10px] ${item.change.startsWith('+') ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {item.change}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-4 px-4 py-2 border-t border-[#2a2e39]">
           <h3 className="text-[10px] font-bold uppercase text-[#787b86] mb-3">Analysis Details</h3>
           <div className="space-y-3">
              <div className="flex justify-between text-xs">
                 <span className="text-[#787b86]">Day High</span>
                 <span>${(currentPrice * 1.005).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="text-[#787b86]">Day Low</span>
                 <span>${(currentPrice * 0.995).toFixed(2)}</span>
              </div>
              <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                 <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={12} className="text-[#2962ff]" />
                    <span className="text-[10px] font-bold text-[#2962ff] uppercase">Strong Buy</span>
                 </div>
                 <p className="text-[10px] text-slate-400">Technical indicators suggest bullish momentum on H4 timeframe.</p>
              </div>
           </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-[#2a2e39]">
        <div className="flex items-center gap-2 text-[10px] text-[#787b86]">
           <Activity size={12} />
           <span>Market Open</span>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
