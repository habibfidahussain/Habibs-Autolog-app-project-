import React, { useState, useMemo } from 'react';
import type { MaintenanceEntry, Currency, ExchangeRates } from '../types';
import { MaintenanceItem } from './MaintenanceItem';

interface FuelLogProps {
  groups: {
    dateIso: string;
    odometerKm: number;
    entries: MaintenanceEntry[];
  }[];
  onDelete: (id: number) => void;
  onEdit: (entry: MaintenanceEntry) => void;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

type SortOption = 'odometer_desc' | 'odometer_asc' | 'date_desc' | 'date_asc' | 'liters_desc' | 'liters_asc' | 'price_desc' | 'price_asc';

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'odometer_desc', label: 'Odometer: High to Low' },
    { value: 'odometer_asc', label: 'Odometer: Low to High' },
    { value: 'date_desc', label: 'Date: Newest to Oldest' },
    { value: 'date_asc', label: 'Date: Oldest to Newest' },
    { value: 'liters_desc', label: 'Liters: High to Low' },
    { value: 'liters_asc', label: 'Liters: Low to High' },
    { value: 'price_desc', label: 'Price/L: High to Low'},
    { value: 'price_asc', label: 'Price/L: Low to High'},
];

export const FuelLog: React.FC<FuelLogProps> = ({ groups, onDelete, onEdit, selectedCurrency, exchangeRates }) => {
  const [sortBy, setSortBy] = useState<SortOption>('odometer_desc');

  const sortedGroups = useMemo(() => {
    const newGroups = [...groups];
    
    // Helper function to get the primary sort value from a group's first entry
    const getSortValue = (group: typeof groups[0], key: keyof MaintenanceEntry) => group.entries[0]?.[key] || 0;

    switch (sortBy) {
        case 'odometer_asc':
            return newGroups.sort((a, b) => a.odometerKm - b.odometerKm);
        case 'date_desc':
            return newGroups.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
        case 'date_asc':
            return newGroups.sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());
        case 'liters_desc':
            return newGroups.sort((a, b) => (getSortValue(b, 'liters') as number) - (getSortValue(a, 'liters') as number));
        case 'liters_asc':
             return newGroups.sort((a, b) => (getSortValue(a, 'liters') as number) - (getSortValue(b, 'liters') as number));
        case 'price_desc':
             return newGroups.sort((a, b) => (getSortValue(b, 'pricePerLiter') as number) - (getSortValue(a, 'pricePerLiter') as number));
        case 'price_asc':
              return newGroups.sort((a, b) => (getSortValue(a, 'pricePerLiter') as number) - (getSortValue(b, 'pricePerLiter') as number));
        case 'odometer_desc':
        default:
            // Groups are pre-sorted by odometer descending from App.tsx
            return groups;
    }
  }, [groups, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-200">Fuel Log</h2>
        <div>
          <label htmlFor="fuel-sort" className="sr-only">Sort entries by</label>
          <select
            id="fuel-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      
      {sortedGroups.length === 0 ? (
        <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
          <h3 className="text-xl font-semibold text-white">No Fuel Records Found</h3>
          <p className="text-gray-400 mt-2">
            Click "Add Entry" and select the "Fuel" category to log your first fill-up.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(group => (
            <MaintenanceItem 
              key={group.dateIso + group.odometerKm} 
              group={group} 
              onDelete={onDelete}
              onEdit={onEdit}
              selectedCurrency={selectedCurrency}
              exchangeRates={exchangeRates}
            />
          ))}
        </div>
      )}
    </div>
  );
};
