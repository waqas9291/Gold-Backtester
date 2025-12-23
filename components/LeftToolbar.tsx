
import React from 'react';
import { DrawingTool } from '../types';
import { 
  MousePointer2, TrendingUp, Square, Minus, 
  Hash, Type, Eraser, Magnet 
} from 'lucide-react';

interface Props {
  activeTool: DrawingTool;
  setTool: (t: DrawingTool) => void;
  magnetMode: boolean;
  toggleMagnet: () => void;
}

const LeftToolbar: React.FC<Props> = ({ activeTool, setTool, magnetMode, toggleMagnet }) => {
  const tools = [
    { id: 'CURSOR', icon: MousePointer2, label: 'Pointer' },
    { id: 'TRENDLINE', icon: TrendingUp, label: 'Trendline' },
    { id: 'RECTANGLE', icon: Square, label: 'Gann & Fibonacci' },
    { id: 'HLINE', icon: Minus, label: 'Line' },
    { id: 'FIB', icon: Hash, label: 'Fibonacci' },
    { id: 'TEXT', icon: Type, label: 'Annotations' },
  ] as const;

  return (
    <aside className="w-12 bg-[#131722] border-r border-[#2a2e39] flex flex-col py-3 items-center z-50">
      <div className="flex flex-col gap-1 w-full items-center px-1">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            title={tool.label}
            className={`p-2.5 rounded hover:bg-[#2a2e39] transition-all group relative ${
              activeTool === tool.id ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86]'
            }`}
          >
            <tool.icon size={20} strokeWidth={2} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2a2e39] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 w-6 h-px bg-[#2a2e39]" />

      <button
        onClick={toggleMagnet}
        className={`mt-4 p-2.5 rounded hover:bg-[#2a2e39] transition-all ${
          magnetMode ? 'text-[#2962ff]' : 'text-[#787b86]'
        }`}
        title="Magnet Mode"
      >
        <Magnet size={20} fill={magnetMode ? "currentColor" : "none"} />
      </button>

      <button
        onClick={() => setTool('ERASER')}
        className={`mt-auto p-2.5 rounded hover:bg-[#2a2e39] text-[#787b86] transition-all`}
        title="Eraser"
      >
        <Eraser size={20} />
      </button>
    </aside>
  );
};

export default LeftToolbar;
