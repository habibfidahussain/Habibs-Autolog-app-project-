import React, { useState, useMemo, useRef } from 'react';
import type { Currency, ExchangeRates } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDateForChart, formatIsoDate } from '../utils/dateUtils';

export interface ChartDataPoint {
  date: string; // YYYY-MM-DD
  value: number; // Cost in PKR
}

interface LineChartProps {
  data: ChartDataPoint[];
  currency: Currency;
  rates: ExchangeRates;
}

export const LineChart: React.FC<LineChartProps> = ({ data, currency, rates }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartDataPoint } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const width = 300;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };

  const { points, path, xTicks, yTicks } = useMemo(() => {
    if (data.length < 2) return { points: [], path: '', xTicks: [], yTicks: [] };

    const dates = data.map(d => new Date(d.date).getTime());
    const values = data.map(d => d.value);

    const minX = Math.min(...dates);
    const maxX = Math.max(...dates);
    const minY = 0; // Start y-axis from 0 for better context
    const dataMaxY = Math.max(...values);
    // If max value is 0, set top of graph to 1 to avoid division by zero.
    const maxY = dataMaxY === 0 ? 1 : dataMaxY * 1.1; 

    const xRange = maxX - minX;
    const yRange = maxY - minY;

    const scaleX = (date: number) => {
        if (xRange === 0) return padding.left;
        return padding.left + ((date - minX) / xRange) * (width - padding.left - padding.right);
    }
    const scaleY = (value: number) => {
        if (yRange === 0) return height - padding.bottom;
        return height - padding.bottom - ((value - minY) / yRange) * (height - padding.top - padding.bottom);
    }

    const scaledPoints = data.map(d => ({
      ...d,
      x: scaleX(new Date(d.date).getTime()),
      y: scaleY(d.value),
    }));

    const linePath = scaledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    // Generate ticks
    const numXTicks = 4;
    const xTickValues = [];
    if (xRange > 0) {
        for (let i = 0; i < numXTicks; i++) {
            const t = i / (numXTicks - 1);
            const date = new Date(minX + t * (maxX - minX));
            xTickValues.push({
                x: scaleX(date.getTime()),
                label: formatDateForChart(date.toISOString().split('T')[0]),
            });
        }
    }

    const numYTicks = 4;
    const yTickValues = [];
    if (yRange > 0) {
        for (let i = 0; i < numYTicks; i++) {
            const t = i / (numYTicks - 1);
            const value = minY + t * (maxY - minY);
            yTickValues.push({
                y: scaleY(value),
                label: formatCurrency(value, currency, rates).replace(/\.00$/, ''),
            });
        }
    }


    return { points: scaledPoints, path: linePath, xTicks: xTickValues, yTicks: yTickValues };
  }, [data, width, height, padding, currency, rates]);
  
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = event.clientX - svgRect.left;

    // Find the closest point to the mouse cursor
    const closestPoint = points.reduce((prev, curr) => 
        Math.abs(curr.x - svgX) < Math.abs(prev.x - svgX) ? curr : prev
    );

    setTooltip({
        x: closestPoint.x,
        y: closestPoint.y,
        point: closestPoint,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  if (data.length < 2) {
    return <div className="flex items-center justify-center h-full text-gray-500">Not enough data to draw a chart.</div>;
  }

  return (
    <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#4A5568" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#4A5568" />

        {/* Ticks */}
        {xTicks.map(tick => (
            <text key={tick.x} x={tick.x} y={height - 5} fill="#A0AEC0" fontSize="8" textAnchor="middle">{tick.label}</text>
        ))}
        {yTicks.map(tick => (
            <text key={tick.y} x={padding.left - 5} y={tick.y} fill="#A0AEC0" fontSize="8" textAnchor="end" dominantBaseline="middle">{tick.label}</text>
        ))}

        {/* Line */}
        <path d={path} fill="none" stroke="#6366F1" strokeWidth="2" />

        {/* Tooltip elements */}
        {tooltip && (
            <>
                <line
                    x1={tooltip.x}
                    y1={padding.top}
                    x2={tooltip.x}
                    y2={height - padding.bottom}
                    stroke="#A0AEC0"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                />
                <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#6366F1" stroke="white" strokeWidth="2" />

                <foreignObject x={tooltip.x > width / 2 ? tooltip.x - 110 : tooltip.x + 10} y={tooltip.y - 40} width="100" height="35">
                    <div className="bg-gray-900/80 text-white text-xs rounded py-1 px-2 shadow-lg border border-gray-600">
                        <div className="font-bold">{formatCurrency(tooltip.point.value, currency, rates)}</div>
                        <div className="text-gray-400">{formatIsoDate(tooltip.point.date)}</div>
                    </div>
                </foreignObject>
            </>
        )}
    </svg>
  );
};