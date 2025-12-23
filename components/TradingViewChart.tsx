
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, IChartApi, ISeriesApi, SeriesMarker, Time, 
  CandlestickData, MouseEventParams, CrosshairMode 
} from 'lightweight-charts';
import { Candle, Trade, DrawingTool, DrawingObject, DrawingPoint } from '../types';

interface Props {
  data: Candle[];
  trades: Trade[];
  drawings: DrawingObject[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  activeTool: DrawingTool;
  magnetMode: boolean;
  timeframe: string;
}

const TradingViewChart: React.FC<Props> = ({ 
  data, trades, drawings, setDrawings, activeTool, magnetMode 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlayRef = useRef<SVGSVGElement>(null);

  // Temporary drawing state
  const [tempPoints, setTempPoints] = useState<DrawingPoint[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelBackgroundColor: '#2962ff' },
        horzLine: { labelBackgroundColor: '#2962ff' },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        barSpacing: 10,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
    });

    // Fix: Cast chart to any to handle potential lightweight-charts type issues with addCandlestickSeries
    const series = (chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    series.setData(data.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle Resize
    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current?.clientWidth, height: containerRef.current?.clientHeight });
    };
    window.addEventListener('resize', handleResize);

    // Click handler for drawing
    chart.subscribeClick((param) => {
      if (activeTool === 'CURSOR' || !param.time || !param.point) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      let finalPrice = price;
      let finalTime = param.time as number;

      if (magnetMode) {
        // Simple Magnet Logic: Check O/H/L/C of current bar
        const candle = data.find(c => c.time === (param.time as number));
        if (candle) {
          const options = [candle.high, candle.low];
          const closest = options.reduce((prev, curr) => 
            Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev
          );
          if (Math.abs(closest - price) < (price * 0.005)) finalPrice = closest;
        }
      }

      const newPoint = { time: finalTime, price: finalPrice };

      if (activeTool === 'TRENDLINE' || activeTool === 'RECTANGLE') {
        if (tempPoints.length === 0) {
          setTempPoints([newPoint]);
        } else {
          const newDrawing: DrawingObject = {
            id: Math.random().toString(36).substr(2, 9),
            type: activeTool,
            points: [tempPoints[0], newPoint],
            color: activeTool === 'TRENDLINE' ? '#2962ff' : 'rgba(41, 98, 255, 0.2)'
          };
          setDrawings(prev => [...prev, newDrawing]);
          setTempPoints([]);
        }
      } else if (activeTool === 'HLINE') {
        setDrawings(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          type: 'HLINE',
          points: [newPoint],
          color: '#2962ff'
        }]);
      } else if (activeTool === 'ERASER') {
        // Eraser logic would go here
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [activeTool, magnetMode, data, setDrawings, tempPoints]);

  // Marker synchronization
  useEffect(() => {
    if (!seriesRef.current) return;
    const markers: SeriesMarker<Time>[] = trades.map(t => ({
      time: t.entryTime as Time,
      position: t.type === 'LONG' ? 'belowBar' : 'aboveBar',
      color: t.type === 'LONG' ? '#26a69a' : '#ef5350',
      shape: t.type === 'LONG' ? 'arrowUp' : 'arrowDown',
      text: t.type,
    }));
    // Fix: Cast series to any to handle setMarkers type detection
    (seriesRef.current as any).setMarkers(markers);
  }, [trades]);

  // Render SVG Overlay for drawings
  const drawingElements = useMemo(() => {
    if (!chartRef.current || !seriesRef.current) return null;
    const ts = chartRef.current.timeScale();
    const series = seriesRef.current;

    return drawings.map(d => {
      if (d.type === 'TRENDLINE' && d.points.length === 2) {
        const x1 = ts.timeToCoordinate(d.points[0].time as Time);
        const y1 = series.priceToCoordinate(d.points[0].price);
        const x2 = ts.timeToCoordinate(d.points[1].time as Time);
        const y2 = series.priceToCoordinate(d.points[1].price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;

        return (
          <line 
            key={d.id} x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke={d.color} strokeWidth="2" 
          />
        );
      }
      if (d.type === 'RECTANGLE' && d.points.length === 2) {
        const x1 = ts.timeToCoordinate(d.points[0].time as Time);
        const y1 = series.priceToCoordinate(d.points[0].price);
        const x2 = ts.timeToCoordinate(d.points[1].time as Time);
        const y2 = series.priceToCoordinate(d.points[1].price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;

        return (
          <rect 
            key={d.id} 
            x={Math.min(x1, x2)} 
            y={Math.min(y1, y2)} 
            width={Math.abs(x2 - x1)} 
            height={Math.abs(y2 - y1)} 
            fill={d.color} 
            stroke="#2962ff" 
            strokeWidth="1"
          />
        );
      }
      return null;
    });
  }, [drawings]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <svg 
        ref={overlayRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      >
        {drawingElements}
      </svg>
    </div>
  );
};

export default TradingViewChart;
