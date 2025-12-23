
import React from 'react';
import { Candle, BacktestResults, StrategyParams, IndicatorVisibility } from '../types';
import TradingViewChart from './TradingViewChart';
import { 
  DollarSign, Percent, TrendingUp, TrendingDown, Clock, 
  MessageSquareQuote, Info, Activity, Zap, History, LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  data: Candle[];
  results: BacktestResults;
  analysis: string;
  params: StrategyParams;
  indicatorVisibility: IndicatorVisibility;
}

const Dashboard: React.FC<DashboardProps> = ({ data, results, analysis, params, indicatorVisibility }) => {
  const metrics = [
    { label: 'Net Profit', value: `$${results.totalProfit.toFixed(2)}`, icon: DollarSign, color: results.totalProfit >= 0 ? 'text-green-500' : 'text-red-500' },
    { label: 'Win Rate', value: `${results.winRate.toFixed(1)}%`, icon: Percent, color: 'text-indigo-400' },
    { label: 'Total Trades', value: results.totalTrades, icon: Clock, color: 'text-slate-400' },
    { label: 'Max Drawdown', value: `${results.maxDrawdown.toFixed(2)}%`, icon: TrendingDown, color: 'text-red-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#10141b] p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-lg group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
              <div className={`p-2 rounded-lg bg-slate-900 ${m.color}`}>
                <m.icon size={16} />
              </div>
            </div>
            <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#10141b] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                  XAUUSD Analysis Engine
                </h3>
             </div>
             <TradingViewChart 
               data={data} 
               trades={results.trades} 
               visibleIndicators={indicatorVisibility} 
             />
          </div>

          <div className="bg-[#10141b] rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden min-h-[300px]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> Execution Log
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161b22] sticky top-0 text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Entry</th>
                    <th className="px-6 py-4">Net P/L</th>
                    <th className="px-6 py-4 text-right">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[...results.trades].reverse().map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-slate-500">{format(new Date(trade.entryTime * 1000), 'MMM dd HH:mm:ss')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded font-bold ${trade.type === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">${trade.entryPrice.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-bold ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 italic">{trade.reason || 'Logic Exit'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
            <Zap className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/20 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareQuote className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-tighter">AI Quant Review</h3>
              </div>
              {analysis ? (
                <div className="text-sm leading-relaxed text-indigo-50 font-medium whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {analysis}
                </div>
              ) : (
                <p className="text-sm text-indigo-100/80 leading-relaxed italic">"Click AI Quant Review for qualitative insights."</p>
              )}
            </div>
          </div>

          <div className="bg-[#10141b] p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard size={14} /> Performance
            </h3>
            <div className="space-y-4">
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Strategy Rating</span>
                    <span className="text-xs font-black text-yellow-500">{(results.winRate * 0.1).toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${results.winRate}%` }}></div>
                  </div>
               </div>
               <div className="p-4 bg-[#0b0e14] rounded-xl border border-dashed border-slate-800 text-center">
                  <Activity className="w-5 h-5 text-slate-700 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-600 font-mono italic">Market Structure Overlay Active</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
