import React, { useState, useMemo } from 'react';
import { Category } from '../types';
import type { Currency, ExchangeRates } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

export interface PieChartDataPoint {
  label: Category;
  value: number; // Cost in PKR
}

interface PieChartProps {
  data: PieChartDataPoint[];
  currency: Currency;
  rates: ExchangeRates;
}

const categoryColors: Record<Category, string> = {
    [Category.Oil]: '#3B82F6', // blue-500
    [Category.Parts]: '#F59E0B', // amber-500
    [Category.Labour]: '#8B5CF6', // violet-500
    [Category.Fuel]: '#10B981', // emerald-500
    [Category.Other]: '#6B7280', // gray-500
};

export const PieChart: React.FC<PieChartProps> = ({ data, currency, rates }) => {
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const size = 200;
    const radius = size / 2;

    const { slices, totalValue } = useMemo(() => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return { slices: [], totalValue: 0 };
        
        let startAngle = -90; // Start at 12 o'clock
        const pieSlices = data.map(d => {
            const angle = (d.value / total) * 360;
            const endAngle = startAngle + angle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = radius + radius * Math.cos(startRad);
            const y1 = radius + radius * Math.sin(startRad);
            const x2 = radius + radius * Math.cos(endRad);
            const y2 = radius + radius * Math.sin(endRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const path = `M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;
            
            startAngle = endAngle;

            return {
                ...d,
                path,
                percentage: (d.value / total) * 100,
            };
        });

        return { slices: pieSlices, totalValue: total };
    }, [data, radius]);

    if (totalValue === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No maintenance costs to display.</div>;
    }

    const hoveredData = slices.find(s => s.label === hoveredSlice);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-full">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex-shrink-0">
                <svg viewBox={`0 0 ${size} ${size}`}>
                    {slices.map(slice => (
                        <path
                            key={slice.label}
                            d={slice.path}
                            fill={categoryColors[slice.label]}
                            onMouseEnter={() => setHoveredSlice(slice.label)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            className="transition-transform duration-200 ease-in-out"
                            style={{ transform: hoveredSlice === slice.label ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'center' }}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        {hoveredData ? (
                            <>
                                <div className="text-2xl font-bold text-white">{hoveredData.percentage.toFixed(1)}%</div>
                                <div className="text-sm font-semibold" style={{ color: categoryColors[hoveredData.label] }}>{hoveredData.label}</div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs text-gray-400">Total Spent</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(totalValue, currency, rates)}</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                {slices.map(slice => (
                     <div 
                        key={slice.label}
                        className="flex items-center gap-3"
                        onMouseEnter={() => setHoveredSlice(slice.label)}
                        onMouseLeave={() => setHoveredSlice(null)}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[slice.label] }} />
                        <div className="flex justify-between flex-grow gap-4">
                            <span className="text-gray-300">{slice.label}</span>
                            <span className="font-semibold text-white">{formatCurrency(slice.value, currency, rates)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};