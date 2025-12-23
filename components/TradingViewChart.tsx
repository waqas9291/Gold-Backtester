
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, SeriesMarker, Time, CandlestickData, MouseEventParams } from 'lightweight-charts';
import { SMA, EMA } from 'technicalindicators';
import { Candle, Trade, IndicatorVisibility, DrawingToolType, DrawingObject, PivotPoints, SDZone } from '../types';
import { calculatePivotPoints, detectSupplyDemandZones } from '../services/backtestEngine';
import { MousePointer2, TrendingUp, Square, Minus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ChartProps {
  data: Candle[];
  trades: Trade[];
  visibleIndicators: IndicatorVisibility;
}

const TradingViewChart: React.FC<ChartProps> = ({ data, trades, visibleIndicators }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);

  const [activeTool, setActiveTool] = useState<DrawingToolType>('NONE');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [pivots, setPivots] = useState<PivotPoints | null>(null);
  const [zones, setZones] = useState<SDZone[]>([]);
  const [tempPoints, setTempPoints] = useState<{ time: number; price: number }[]>([]);
  
  const [tooltip, setTooltip] = useState({
    time: '', open: 0, high: 0, low: 0, close: 0, isVisible: false
  });

  // Effect to calculate automatic visuals
  useEffect(() => {
    if (data.length > 0) {
      setPivots(calculatePivotPoints(data));
      setZones(detectSupplyDemandZones(data));
    }
  }, [data]);

  // Main Chart Logic
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: { background: { color: '#0b0e14' }, textColor: '#94a3b8', fontSize: 11 },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: { mode: 0, vertLine: { labelBackgroundColor: '#6366f1' }, horzLine: { labelBackgroundColor: '#6366f1' } },
      timeScale: { borderColor: '#1e293b', timeVisible: true, barSpacing: 10 },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444',
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
    const closePrices = data.map(c => c.close);
    if (visibleIndicators.sma) {
      const smaLine = chart.addLineSeries({ color: '#6366f1', lineWidth: 2, title: 'SMA 50' });
      smaLine.setData(data.slice(data.length - SMA.calculate({ period: 50, values: closePrices }).length).map((c, i) => ({
        time: c.time as Time, value: SMA.calculate({ period: 50, values: closePrices })[i]
      })));
    }

    // Trade Markers
    const markers: SeriesMarker<Time>[] = [];
    trades.forEach(t => {
      markers.push({
        time: t.entryTime as Time,
        position: t.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color: t.type === 'LONG' ? '#22c55e' : '#ef4444',
        shape: t.type === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: t.type,
      });
      if (t.status === 'CLOSED') {
        markers.push({
          time: t.exitTime as Time,
          position: t.type === 'LONG' ? 'aboveBar' : 'belowBar',
          color: t.profit >= 0 ? '#10b981' : '#f43f5e',
          shape: 'circle',
          text: 'EXIT',
        });
      }
    });
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    candleSeries.setMarkers(markers);

    // Click & Move handling for tools
    chart.subscribeClick((param: MouseEventParams) => {
      if (activeTool === 'NONE' || !param.time || !param.point) return;
      
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      const newPoint = { time: param.time as number, price };

      if (activeTool === 'HLINE') {
        setDrawings(prev => [...prev, {
          id: Math.random().toString(),
          type: 'HLINE',
          points: [newPoint],
          color: '#fbbf24'
        }]);
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
          setTooltip({ isVisible: true, time: new Date((param.time as number) * 1000).toLocaleString(), ...d });
        }
      }
    });

    chartRef.current = chart;
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [data, trades, visibleIndicators, activeTool, tempPoints]);

  // Effect to sync and draw on Canvas Overlay
  useEffect(() => {
    const canvas = canvasOverlayRef.current;
    if (!canvas || !chartRef.current || !candleSeriesRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const timeScale = chartRef.current!.timeScale();
      const series = candleSeriesRef.current;

      // Draw Automatic S/D Zones
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

      // Draw Pivot Points
      if (visibleIndicators.pivots && pivots) {
        const drawPivot = (price: number, label: string, color: string) => {
          const y = series.priceToCoordinate(price);
          if (y !== null) {
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = color;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = '10px monospace';
            ctx.fillText(label, 10, y - 5);
            ctx.setLineDash([]);
          }
        };
        drawPivot(pivots.p, 'PIVOT', '#94a3b8');
        drawPivot(pivots.r1, 'R1', '#ef4444');
        drawPivot(pivots.s1, 'S1', '#22c55e');
      }

      // Draw User Objects
      drawings.forEach(obj => {
        if (obj.type === 'TRENDLINE' && obj.points.length === 2) {
          const x1 = timeScale.timeToCoordinate(obj.points[0].time as Time);
          const y1 = series.priceToCoordinate(obj.points[0].price);
          const x2 = timeScale.timeToCoordinate(obj.points[1].time as Time);
          const y2 = series.priceToCoordinate(obj.points[1].price);
          if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        } else if (obj.type === 'RECTANGLE' && obj.points.length === 2) {
            const x1 = timeScale.timeToCoordinate(obj.points[0].time as Time);
            const y1 = series.priceToCoordinate(obj.points[0].price);
            const x2 = timeScale.timeToCoordinate(obj.points[1].time as Time);
            const y2 = series.priceToCoordinate(obj.points[1].price);
            if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
              ctx.fillStyle = obj.color;
              ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
              ctx.strokeStyle = '#fbbf24';
              ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        } else if (obj.type === 'HLINE') {
          const y = series.priceToCoordinate(obj.points[0].price);
          if (y !== null) {
            ctx.strokeStyle = obj.color;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
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
    
    // Polling render to keep in sync with chart pans
    const timer = setInterval(render, 32); 

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, [drawings, pivots, zones, visibleIndicators]);

  return (
    <div className="relative flex flex-col gap-2">
      {/* Tool Toolbar */}
      <div className="flex items-center gap-1 bg-[#10141b] border border-slate-800 p-1.5 rounded-lg w-fit mb-2">
        <ToolBtn active={activeTool === 'NONE'} onClick={() => setActiveTool('NONE')} icon={<MousePointer2 size={16}/>} label="Cursor" />
        <ToolBtn active={activeTool === 'TRENDLINE'} onClick={() => setActiveTool('TRENDLINE')} icon={<TrendingUp size={16}/>} label="Trendline" />
        <ToolBtn active={activeTool === 'RECTANGLE'} onClick={() => setActiveTool('RECTANGLE')} icon={<Square size={16}/>} label="Zone Rect" />
        <ToolBtn active={activeTool === 'HLINE'} onClick={() => setActiveTool('HLINE')} icon={<Minus size={16}/>} label="H-Level" />
        <div className="w-px h-6 bg-slate-800 mx-1" />
        <button 
          onClick={() => setDrawings([])} 
          className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
          title="Clear All Drawings"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-[500px] border border-slate-800 rounded-xl overflow-hidden bg-[#0b0e14]" />
        <canvas 
          ref={canvasOverlayRef} 
          className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-10"
        />
        
        {/* Tooltip */}
        {tooltip.isVisible && (
          <div className="absolute top-4 right-4 z-20 bg-[#161b22]/90 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-xl font-mono text-[10px] pointer-events-none">
            <div className="text-slate-500 mb-1">{tooltip.time}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>O: <span className="text-slate-100">${tooltip.open.toFixed(2)}</span></span>
              <span>H: <span className="text-green-500">${tooltip.high.toFixed(2)}</span></span>
              <span>L: <span className="text-red-500">${tooltip.low.toFixed(2)}</span></span>
              <span>C: <span className="text-slate-100">${tooltip.close.toFixed(2)}</span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 px-2">
        <IndicatorTag active={visibleIndicators.pivots} label="Auto Pivots" />
        <IndicatorTag active={visibleIndicators.zones} label="S/D Detection" />
        {activeTool !== 'NONE' && (
          <div className="ml-auto text-xs font-bold text-yellow-500 animate-pulse">
            DRAWING MODE: Click on chart to place points
          </div>
        )}
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg flex items-center gap-2 transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'
    }`}
    title={label}
  >
    {icon}
  </button>
);

const IndicatorTag = ({ active, label }: any) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold transition-colors ${
    active ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 text-slate-500'
  }`}>
    {active ? <Eye size={12}/> : <EyeOff size={12}/>}
    {label}
  </div>
);

export default TradingViewChart;
