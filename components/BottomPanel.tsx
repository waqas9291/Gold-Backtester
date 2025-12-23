
import React from 'react';
import { BacktestResults } from '../types';
import { format } from 'date-fns';
import { LayoutList, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  tab: 'STRATEGY' | 'LOG';
  setTab: (t: 'STRATEGY' | 'LOG') => void;
  results: BacktestResults;
}

const BottomPanel: React.FC<Props> = ({ tab, setTab, results }) => {
  return (
    <div className="h-[280px] bg-[#131722] border-t border-[#2a2e39] flex flex-col">
      <div className="h-9 bg-[#1c202b] flex items-center px-4 gap-6">
        <button 
          onClick={() => setTab('STRATEGY')}
          className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${
            tab === 'STRATEGY' ? 'text-[#2962ff] border-b-2 border-[#2962ff] h-full mt-0.5' : 'text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <BarChart3 size={14} /> Strategy Tester
        </button>
        <button 
          onClick={() => setTab('LOG')}
          className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${
            tab === 'LOG' ? 'text-[#2962ff] border-b-2 border-[#2962ff] h-full mt-0.5' : 'text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <LayoutList size={14} /> Trade Log
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'STRATEGY' ? (
          <div className="p-6 grid grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#787b86]">Performance Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[#26a69a]">${results.totalProfit.toFixed(2)}</span>
                  <span className="text-[10px] text-[#787b86]">Net Profit</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-indigo-400">{results.winRate.toFixed(1)}%</span>
                  <span className="text-[10px] text-[#787b86]">Win Rate</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#787b86]">Risk Metrics</h4>
               <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#ef5350]">{results.maxDrawdown.toFixed(2)}%</span>
                  <span className="text-[10px] text-[#787b86]">Max Drawdown</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">1.42</span>
                  <span className="text-[10px] text-[#787b86]">Profit Factor</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 bg-[#1e222d] rounded-lg p-4 border border-[#2a2e39] flex items-center justify-center">
               <div className="text-center opacity-40">
                  <TrendingUp size={24} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Equity Curve Visualizer</p>
                  <p className="text-[9px]">Run complete backtest to see distribution</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 bg-[#1c202b] text-[#787b86] uppercase font-bold border-b border-[#2a2e39]">
                <tr>
                  <th className="px-6 py-2">Symbol</th>
                  <th className="px-6 py-2">Type</th>
                  <th className="px-6 py-2">Entry</th>
                  <th className="px-6 py-2">Exit</th>
                  <th className="px-6 py-2">P/L ($)</th>
                  <th className="px-6 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {[...results.trades].reverse().map(trade => (
                  <tr key={trade.id} className="hover:bg-[#2a2e39]/30 transition-colors group">
                    <td className="px-6 py-2.5 font-bold">XAUUSD</td>
                    <td className="px-6 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${trade.type === 'LONG' ? 'bg-[#26a69a]/10 text-[#26a69a]' : 'bg-[#ef5350]/10 text-[#ef5350]'}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-2.5">${trade.entryPrice.toFixed(2)}</td>
                    <td className="px-6 py-2.5">${trade.exitPrice > 0 ? trade.exitPrice.toFixed(2) : '--'}</td>
                    <td className={`px-6 py-2.5 font-mono font-bold ${trade.profit >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-2.5 uppercase text-[9px] font-bold text-[#787b86]">{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
