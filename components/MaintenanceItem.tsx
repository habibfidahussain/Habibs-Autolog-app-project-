import React from 'react';
import type { MaintenanceEntry, Currency, ExchangeRates } from '../types';
import { formatIsoDate } from '../utils/dateUtils';
import { Category } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface MaintenanceItemGroupProps {
  group: {
    dateIso: string;
    odometerKm: number;
    entries: MaintenanceEntry[];
  };
  onDelete: (id: number) => void;
  onEdit: (entry: MaintenanceEntry) => void;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

const categoryColors: Record<Category, string> = {
    [Category.Oil]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [Category.Parts]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [Category.Labour]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [Category.Fuel]: 'bg-green-500/20 text-green-300 border-green-500/30',
    [Category.Other]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export const MaintenanceItem: React.FC<MaintenanceItemGroupProps> = ({ group, onDelete, onEdit, selectedCurrency, exchangeRates }) => {
  const isGroupScheduled = group.entries.some(e => e.status === 'scheduled');
  
  return (
    <div className={`
      bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300
      ${isGroupScheduled ? 'shadow-blue-500/20 ring-1 ring-blue-500/20' : 'hover:shadow-indigo-500/20'}
    `}>
      {/* Header for the group */}
      <div className="bg-gray-700/50 p-4 flex justify-between items-center border-b border-gray-700">
        <p className="font-bold text-lg text-white">{group.odometerKm.toLocaleString()} KM</p>
        <p className="text-sm text-gray-300">{formatIsoDate(group.dateIso)}</p>
      </div>
      
      {/* List of entries for that day */}
      <div className="divide-y divide-gray-700/70">
        {group.entries.map((entry) => (
          <div key={entry.id} className={`p-4 flex items-center gap-4 transition-colors duration-200 ${entry.status === 'logged' ? 'hover:bg-gray-700/40' : 'bg-blue-500/5'}`}>
            <div className="flex-grow">
              <p className="text-gray-200">
                {entry.description}
                {entry.categories.includes(Category.Fuel) && entry.liters && (
                  <span className="text-gray-400 text-sm">
                    {' '}({entry.liters} L
                    {entry.pricePerLiter && ` @ ${formatCurrency(entry.pricePerLiter, selectedCurrency, exchangeRates, 2)}/L`})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {entry.categories.map(cat => (
                   <span key={cat} className={`px-3 py-1 text-xs font-medium rounded-full border ${categoryColors[cat]}`}>
                    {cat}
                   </span>
                ))}
                {entry.status === 'scheduled' && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-200 border border-blue-700">
                        Scheduled
                    </span>
                )}
                {entry.status === 'logged' && entry.cost > 0 && (
                    <p className="text-md font-semibold text-green-400">
                      {formatCurrency(entry.cost, selectedCurrency, exchangeRates)}
                    </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {entry.status === 'scheduled' ? (
                <button onClick={() => onEdit(entry)} className="py-2 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                  Log Task
                </button>
              ) : (
                <>
                  <button onClick={() => onEdit(entry)} className="p-2 rounded-full hover:bg-gray-600 transition-colors" aria-label="Edit entry">
                      <EditIcon />
                  </button>
                  <button onClick={() => onDelete(entry.id)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors" aria-label="Delete entry">
                      <DeleteIcon />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);