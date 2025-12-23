
import React from 'react';
import { StrategyParams, IndicatorVisibility } from '../types';
import { Shield, Settings2, Crosshair, BarChart4 } from 'lucide-react';

interface SidebarProps {
  params: StrategyParams;
  setParams: (p: StrategyParams) => void;
  indicatorVisibility: IndicatorVisibility;
  setIndicatorVisibility: (v: IndicatorVisibility) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ params, setParams, indicatorVisibility, setIndicatorVisibility }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams({ ...params, [name]: parseFloat(value) });
  };

  const toggleIndicator = (key: keyof IndicatorVisibility) => {
    setIndicatorVisibility({ ...indicatorVisibility, [key]: !indicatorVisibility[key] });
  };

  return (
    <aside className="w-80 bg-[#10141b] border-r border-slate-800 flex flex-col overflow-y-auto">
      <div className="p-6 space-y-8">
        <section>
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Shield size={14} className="text-yellow-500" /> Risk Management
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Stop Loss (Pips)</span>
                <span className="text-yellow-500 font-bold">{params.stopLossPips}</span>
              </div>
              <input 
                type="range" name="stopLossPips" min="10" max="500" step="5"
                value={params.stopLossPips} onChange={handleChange}
                className="w-full accent-yellow-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Take Profit (Pips)</span>
                <span className="text-green-500 font-bold">{params.takeProfitPips}</span>
              </div>
              <input 
                type="range" name="takeProfitPips" min="10" max="1000" step="10"
                value={params.takeProfitPips} onChange={handleChange}
                className="w-full accent-green-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Crosshair size={14} className="text-indigo-500" /> Signal Parameters
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">RSI PERIOD</label>
              <input type="number" name="rsiPeriod" value={params.rsiPeriod} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">SMA TREND</label>
              <input type="number" name="smaPeriod" value={params.smaPeriod} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-4">
             <BarChart4 size={14} className="text-slate-400" /> Visibility
          </h3>
          <div className="space-y-2">
            {[
              { id: 'sma', label: 'SMA (Trend)' },
              { id: 'rsi', label: 'RSI (Momentum)' },
              { id: 'pivots', label: 'Pivot Points' },
              { id: 'zones', label: 'S/D Zones' },
            ].map(ind => (
              <div key={ind.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleIndicator(ind.id as any)}>
                <span className="text-[11px] font-bold text-slate-400 uppercase">{ind.label}</span>
                <div className={`w-3 h-3 rounded-full transition-all ${indicatorVisibility[ind.id as keyof IndicatorVisibility] ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-3 text-slate-500 text-xs italic mb-2">
          <Settings2 size={12} /> Version 5.1.0 Pro
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
