import React from 'react';
import type { DateRangePreset, OdometerRange } from '../types';

interface HistoryFiltersProps {
  dateFilter: DateRangePreset;
  onDateFilterChange: (preset: DateRangePreset) => void;
  odometerFilter: OdometerRange;
  onOdometerFilterChange: (range: OdometerRange) => void;
}

const datePresets: { label: string; value: DateRangePreset }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Last 90 Days', value: 'last_90_days' },
  { label: 'Last Year', value: 'last_year' },
];

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  dateFilter,
  onDateFilterChange,
  odometerFilter,
  onOdometerFilterChange,
}) => {
  const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onOdometerFilterChange({
      ...odometerFilter,
      [name]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Date</label>
        <div className="flex flex-wrap gap-2">
          {datePresets.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onDateFilterChange(value)}
              className={`
                py-1.5 px-3 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
                ${dateFilter === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Odometer Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Odometer (KM)</label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="min"
            value={odometerFilter.min}
            onChange={handleOdometerChange}
            placeholder="Min KM"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="number"
            name="max"
            value={odometerFilter.max}
            onChange={handleOdometerChange}
            placeholder="Max KM"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
