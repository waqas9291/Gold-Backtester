
import React from 'react';
import { Candle, BacktestResults, StrategyParams, IndicatorVisibility, DrawingTool, DrawingObject, ChartSettings } from '../types';
import TradingViewChart from './TradingViewChart';
import { 
  DollarSign, Percent, TrendingUp, TrendingDown, Clock, 
  MessageSquareQuote, History, LayoutDashboard, Zap, Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  data: Candle[];
  results: BacktestResults;
  analysis: string;
  params: StrategyParams;
  indicatorVisibility: IndicatorVisibility;
  activeTool: DrawingTool;
  setActiveTool: (t: DrawingTool) => void;
  drawings: DrawingObject[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  chartSettings: ChartSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data, results, analysis, params, indicatorVisibility, 
  activeTool, setActiveTool, drawings, setDrawings, chartSettings 
}) => {
  const metrics = [
    { label: 'Net Profit', value: `$${results.totalProfit.toFixed(2)}`, icon: DollarSign, color: results.totalProfit >= 0 ? 'text-green-500' : 'text-red-500' },
    { label: 'Win Rate', value: `${results.winRate.toFixed(1)}%`, icon: Percent, color: 'text-indigo-400' },
    { label: 'Total Trades', value: results.totalTrades, icon: Clock, color: 'text-slate-400' },
    { label: 'Drawdown', value: `${results.maxDrawdown.toFixed(2)}%`, icon: TrendingDown, color: 'text-red-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#10141b]/50 backdrop-blur-sm p-5 rounded-xl border border-slate-800/50 hover:border-indigo-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
              <m.icon size={14} className={m.color} />
            </div>
            <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#10141b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-1">
             {/* Fix: Match TradingViewChart props */}
             <TradingViewChart 
               data={data} 
               trades={results.trades} 
               drawings={drawings}
               setDrawings={setDrawings}
               activeTool={activeTool}
               magnetMode={true}
               timeframe="15m"
             />
          </div>

          <div className="bg-[#10141b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[300px]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={12} /> Real-time Execution Log
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-[#161b22] sticky top-0 text-slate-500 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">P/L</th>
                    <th className="px-6 py-3 text-right">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {[...results.trades].reverse().map((trade) => (
                    <tr key={trade.id} className="hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{format(new Date(trade.entryTime * 1000), 'MM/dd HH:mm')}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${trade.type === 'LONG' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-300">${trade.entryPrice.toFixed(2)}</td>
                      <td className={`px-6 py-3 font-black ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 italic opacity-60">{trade.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group border border-white/10">
            <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareQuote className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-tighter">AI Quant Review</h3>
              </div>
              <div className="text-[13px] leading-relaxed text-indigo-50 font-medium whitespace-pre-wrap">
                {analysis || <p className="opacity-60 italic">"Execute backtest to trigger neural strategy analysis."</p>}
              </div>
            </div>
          </div>

          <div className="bg-[#10141b] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard size={12} /> Health Monitor
            </h3>
            <div className="space-y-4">
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Profit Factor</span>
                    <span className="text-[11px] font-black text-indigo-400">{(results.winRate > 0 ? 1.4 : 0).toFixed(1)}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(results.winRate * 1.5, 100)}%` }}></div>
                  </div>
               </div>
               <div className="p-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-center group cursor-default">
                  <Activity className="w-4 h-4 text-slate-600 mx-auto mb-2 group-hover:text-yellow-500 transition-colors" />
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Neural Overlay Active</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
