import React from 'react';
import type { MaintenanceEntry, Currency, ExchangeRates } from '../types';
import { MaintenanceItem } from './MaintenanceItem';

interface MaintenanceListProps {
  groups: {
    dateIso: string;
    odometerKm: number;
    entries: MaintenanceEntry[];
  }[];
  onDelete: (id: number) => void;
  onEdit: (entry: MaintenanceEntry) => void;
  searchQuery: string;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({ groups, onDelete, onEdit, searchQuery, selectedCurrency, exchangeRates }) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-gray-800 rounded-lg mt-6">
        <h3 className="text-xl font-semibold text-white">
          {searchQuery ? 'No Results Found' : 'No Maintenance Records Found'}
        </h3>
        <p className="text-gray-400 mt-2">
          {searchQuery ? `Your search for "${searchQuery}" did not return any results.` : 'Click "Add Entry" to log your first maintenance task.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
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
  );
};