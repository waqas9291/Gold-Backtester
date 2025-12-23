
import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  SeriesMarker, 
  Time, 
  CandlestickData, 
  MouseEventParams, 
  LogicalRange 
} from 'lightweight-charts';
import { SMA } from 'technicalindicators';
import { 
  Candle, 
  Trade, 
  IndicatorVisibility, 
  DrawingToolType, 
  DrawingObject, 
  PivotPoints, 
  SDZone, 
  ChartSettings 
} from '../types';
import { calculatePivotPoints, detectSupplyDemandZones } from '../services/backtestEngine';
import { MousePointer2, TrendingUp, Square, Minus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ChartProps {
  data: Candle[];
  trades: Trade[];
  visibleIndicators: IndicatorVisibility;
  activeTool: DrawingToolType;
  setActiveTool: (t: DrawingToolType) => void;
  drawings: DrawingObject[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  settings: ChartSettings;
}

const TradingViewChart: React.FC<ChartProps> = ({ 
  data, trades, visibleIndicators, activeTool, setActiveTool, drawings, setDrawings, settings 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const lastVisibleRange = useRef<LogicalRange | null>(null);

  const [pivots, setPivots] = useState<PivotPoints | null>(null);
  const [zones, setZones] = useState<SDZone[]>([]);
  const [tempPoints, setTempPoints] = useState<{ time: number; price: number }[]>([]);
  
  const [tooltip, setTooltip] = useState({
    time: '', open: 0, high: 0, low: 0, close: 0, isVisible: false
  });

  useEffect(() => {
    if (data.length > 0) {
      setPivots(calculatePivotPoints(data));
      setZones(detectSupplyDemandZones(data));
    }
  }, [data]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Capture range before updating
    if (chartRef.current) {
      lastVisibleRange.current = chartRef.current.timeScale().getVisibleLogicalRange();
    }

    // Fix: Using applyOptions for watermark if it's causing issues in createChart initial config
    // or ensuring it matches the expected type. Some versions of lightweight-charts 
    // might have different property locations for watermark.
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: { 
        background: { color: '#0b0e14' }, 
        textColor: '#94a3b8', 
        fontSize: 11,
      },
      grid: { 
        vertLines: { visible: settings.showGridVert, color: '#1e293b' }, 
        horzLines: { visible: settings.showGridHorz, color: '#1e293b' } 
      },
      crosshair: { mode: 0 },
      timeScale: { 
        borderColor: '#1e293b', 
        timeVisible: true, 
        barSpacing: 10,
        rightOffset: settings.rightOffset,
      },
    });

    // Fix: Applying watermark separately to avoid type conflict in initial createChart call
    chart.applyOptions({
      watermark: {
        visible: !!settings.watermark,
        fontSize: 24,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(255, 255, 255, 0.05)',
        text: settings.watermark,
      } as any
    });

    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: settings.upColor, 
      downColor: settings.downColor, 
      borderVisible: false, 
      wickUpColor: settings.upColor, 
      wickDownColor: settings.downColor,
    });

    candleSeries.setData(data.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));
    candleSeriesRef.current = candleSeries;

    // Indicators
    if (visibleIndicators.sma) {
      const smaLine = (chart as any).addLineSeries({ color: '#6366f1', lineWidth: 2, title: 'SMA 50' });
      const smaValues = SMA.calculate({ period: 50, values: data.map(c => c.close) });
      const smaData = data.slice(data.length - smaValues.length).map((c, i) => ({
        time: c.time as Time, value: smaValues[i]
      }));
      smaLine.setData(smaData);
    }

    // Trade Markers
    const markers: SeriesMarker<Time>[] = trades.flatMap(t => {
      const ms: SeriesMarker<Time>[] = [{
        time: t.entryTime as Time,
        position: t.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color: t.type === 'LONG' ? '#22c55e' : '#ef4444',
        shape: t.type === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: t.type,
      }];
      if (t.status === 'CLOSED') {
        ms.push({
          time: t.exitTime as Time,
          position: t.type === 'LONG' ? 'aboveBar' : 'belowBar',
          color: t.profit >= 0 ? '#10b981' : '#f43f5e',
          shape: 'circle',
          text: 'EXIT',
        });
      }
      return ms;
    }).sort((a, b) => (a.time as number) - (b.time as number));
    
    candleSeries.setMarkers(markers);

    // Restore Range
    if (lastVisibleRange.current) {
      chart.timeScale().setVisibleLogicalRange(lastVisibleRange.current);
    } else {
      chart.timeScale().fitContent();
    }

    chart.subscribeClick((param: MouseEventParams) => {
      if (activeTool === 'NONE' || !param.time || !param.point) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price === null) return;
      const newPoint = { time: param.time as number, price };

      if (activeTool === 'HLINE') {
        setDrawings(prev => [...prev, { id: Math.random().toString(), type: 'HLINE', points: [newPoint], color: '#fbbf24' }]);
        setActiveTool('NONE');
      } else {
        if (tempPoints.length === 0) {
          setTempPoints([newPoint]);
        } else {
          setDrawings(prev => [...prev, {
            id: Math.random().toString(),
            type: activeTool,
            points: [...tempPoints, newPoint],
            color: activeTool === 'TRENDLINE' ? '#60a5fa' : 'rgba(234, 179, 8, 0.2)'
          }]);
          setTempPoints([]);
          setActiveTool('NONE');
        }
      }
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        setTooltip(prev => ({ ...prev, isVisible: false }));
      } else {
        const d = param.seriesData.get(candleSeries) as CandlestickData<Time>;
        if (d) {
          setTooltip({ 
            isVisible: true, 
            time: new Date((param.time as number) * 1000).toLocaleString(),
            open: d.open, high: d.high, low: d.low, close: d.close
          });
        }
      }
    });

    chartRef.current = chart;

    return () => chart.remove();
  }, [data, trades, visibleIndicators, activeTool, tempPoints, settings]);

  // Session Shading & Drawing Render
  useEffect(() => {
    const canvas = canvasOverlayRef.current;
    if (!canvas || !chartRef.current || !candleSeriesRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const timeScale = chartRef.current!.timeScale();
      const series = candleSeriesRef.current;

      // Sessions
      if (visibleIndicators.sessions) {
        data.forEach((c, i) => {
          if (i % 2 === 0) { // Optimization: check every 2nd bar for sessions
             const date = new Date(c.time * 1000);
             const h = date.getUTCHours();
             let color = '';
             if (h >= 0 && h < 9) color = 'rgba(59, 130, 246, 0.05)'; // Tokyo
             else if (h >= 8 && h < 17) color = 'rgba(34, 197, 94, 0.05)'; // London
             else if (h >= 13 && h < 22) color = 'rgba(239, 68, 68, 0.05)'; // NY
             
             if (color) {
               const x = timeScale.timeToCoordinate(c.time as Time);
               const xNext = timeScale.timeToCoordinate((c.time + 3600) as Time); // approximate width
               if (x !== null) {
                 ctx.fillStyle = color;
                 ctx.fillRect(x, 0, (xNext || x + 20) - x, canvas.height);
               }
             }
          }
        });
      }

      // Zones
      if (visibleIndicators.zones) {
        zones.forEach(zone => {
          const x1 = timeScale.timeToCoordinate(zone.timeStart as Time);
          const y1 = series.priceToCoordinate(zone.priceStart);
          const y2 = series.priceToCoordinate(zone.priceEnd);
          if (x1 !== null && y1 !== null && y2 !== null) {
            ctx.fillStyle = zone.type === 'SUPPLY' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
            ctx.fillRect(x1, Math.min(y1, y2), canvas.width - x1, Math.abs(y1 - y2));
          }
        });
      }

      // Drawings
      drawings.forEach(obj => {
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        if (obj.type === 'TRENDLINE' && p1 && p2) {
          const x1 = timeScale.timeToCoordinate(p1.time as Time);
          const y1 = series.priceToCoordinate(p1.price);
          const x2 = timeScale.timeToCoordinate(p2.time as Time);
          const y2 = series.priceToCoordinate(p2.price);
          if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          }
        } else if (obj.type === 'RECTANGLE' && p1 && p2) {
            const x1 = timeScale.timeToCoordinate(p1.time as Time);
            const y1 = series.priceToCoordinate(p1.price);
            const x2 = timeScale.timeToCoordinate(p2.time as Time);
            const y2 = series.priceToCoordinate(p2.price);
            if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
              ctx.fillStyle = obj.color;
              ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
              ctx.strokeStyle = '#fbbf24'; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        } else if (obj.type === 'HLINE') {
          const y = series.priceToCoordinate(p1.price);
          if (y !== null) {
            ctx.strokeStyle = obj.color;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
          }
        }
      });
    };

    const handleResize = () => {
      if (chartContainerRef.current) {
        canvas.width = chartContainerRef.current.clientWidth;
        canvas.height = 500;
        render();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    const timer = setInterval(render, 32); 
    return () => { window.removeEventListener('resize', handleResize); clearInterval(timer); };
  }, [drawings, pivots, zones, visibleIndicators, data]);

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-[#10141b] border border-slate-800 p-1.5 rounded-lg w-fit mb-2 shadow-inner">
        <ToolBtn active={activeTool === 'NONE'} onClick={() => setActiveTool('NONE')} icon={<MousePointer2 size={16}/>} label="Cursor" />
        <ToolBtn active={activeTool === 'TRENDLINE'} onClick={() => setActiveTool('TRENDLINE')} icon={<TrendingUp size={16}/>} label="Trendline" />
        <ToolBtn active={activeTool === 'RECTANGLE'} onClick={() => setActiveTool('RECTANGLE')} icon={<Square size={16}/>} label="Zone" />
        <ToolBtn active={activeTool === 'HLINE'} onClick={() => setActiveTool('HLINE')} icon={<Minus size={16}/>} label="H-Level" />
        <div className="w-px h-6 bg-slate-800 mx-1" />
        <button onClick={() => setDrawings([])} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
      </div>

      <div className="relative group">
        <div ref={chartContainerRef} className="w-full h-[500px] border border-slate-800 rounded-xl overflow-hidden bg-[#0b0e14] shadow-2xl" />
        <canvas ref={canvasOverlayRef} className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-10" />
        {tooltip.isVisible && (
          <div className="absolute top-4 left-4 z-20 bg-[#161b22]/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl font-mono text-[10px] pointer-events-none transition-all">
            <div className="text-slate-500 mb-1">{tooltip.time}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <span>O: <span className="text-slate-100">${tooltip.open.toFixed(2)}</span></span>
              <span>H: <span className="text-green-400 font-bold">${tooltip.high.toFixed(2)}</span></span>
              <span>L: <span className="text-red-400 font-bold">${tooltip.low.toFixed(2)}</span></span>
              <span>C: <span className="text-slate-100">${tooltip.close.toFixed(2)}</span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 px-2">
        <IndicatorTag active={visibleIndicators.pivots} label="Pivots" />
        <IndicatorTag active={visibleIndicators.zones} label="S/D Detection" />
        <IndicatorTag active={visibleIndicators.sessions} label="Sessions" />
        {activeTool !== 'NONE' && (
          <div className="ml-auto text-[10px] font-black text-yellow-500 animate-pulse flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> DRAWING {activeTool}
          </div>
        )}
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`p-2 rounded-lg flex items-center transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`} title={label}>{icon}</button>
);

const IndicatorTag = ({ active, label }: any) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase transition-all ${active ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-slate-800 text-slate-500 opacity-60'}`}>
    {active ? <Eye size={10}/> : <EyeOff size={10}/>} {label}
  </div>
);

export default TradingViewChart;
