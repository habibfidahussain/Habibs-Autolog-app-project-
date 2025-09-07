import React, { useMemo } from 'react';
import type { MaintenanceEntry, ExchangeRates } from '../types';
import { Category, Currency } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface SummaryCardProps {
  entries: MaintenanceEntry[];
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
  onCurrencyChange: (currency: Currency) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ entries, selectedCurrency, exchangeRates, onCurrencyChange }) => {
  const { oil, parts, labour, grandTotal, maintenanceCostPerKm, fuelCostPerKm, fuelAverage } = useMemo(() => {
    const totals: { [key in Category]: number } = {
      [Category.Oil]: 0,
      [Category.Parts]: 0,
      [Category.Labour]: 0,
      [Category.Fuel]: 0,
      [Category.Other]: 0,
    };

    if (entries.length < 2) {
      return { oil: 0, parts: 0, labour: 0, grandTotal: 0, maintenanceCostPerKm: null, fuelCostPerKm: null, fuelAverage: null };
    }

    let minOdometer = Infinity;
    let maxOdometer = 0;

    entries.forEach(entry => {
      // Distribute cost among categories for multi-category entries
      if (entry.categories.includes(Category.Fuel)) {
          totals[Category.Fuel] += entry.cost;
      } else {
          const maintenanceCategories = entry.categories.filter(c => c !== Category.Fuel);
          if (maintenanceCategories.length > 0) {
              const costPerCategory = entry.cost / maintenanceCategories.length;
              maintenanceCategories.forEach(cat => {
                  if (cat in totals) {
                      totals[cat] += costPerCategory;
                  }
              });
          }
      }
      
      if (entry.odometerKm < minOdometer) minOdometer = entry.odometerKm;
      if (entry.odometerKm > maxOdometer) maxOdometer = entry.odometerKm;
    });

    const maintenanceTotal = totals[Category.Oil] + totals[Category.Parts] + totals[Category.Labour] + totals[Category.Other];
    const totalFuelCost = totals[Category.Fuel];
    const grandTotal = maintenanceTotal + totalFuelCost;

    const totalDistance = maxOdometer - minOdometer;
    const maintenanceCostPerKm = totalDistance > 0 ? maintenanceTotal / totalDistance : 0;
    const fuelCostPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;
    
    // Fuel Average Calculation
    const fuelEntries = entries
      .filter(e => e.categories.includes(Category.Fuel) && e.liters && e.liters > 0)
      .sort((a, b) => a.odometerKm - b.odometerKm);
      
    let fuelAverage = null;
    if (fuelEntries.length >= 2) {
      const firstFuelStop = fuelEntries[0];
      const lastFuelStop = fuelEntries[fuelEntries.length - 1];
      const distanceOnFuel = lastFuelStop.odometerKm - firstFuelStop.odometerKm;

      // Sum all liters except the last fill-up, as that fuel hasn't been used yet.
      const totalLitersConsumed = fuelEntries.slice(0, -1).reduce((sum, e) => sum + (e.liters || 0), 0);
      
      if (distanceOnFuel > 0 && totalLitersConsumed > 0) {
        fuelAverage = distanceOnFuel / totalLitersConsumed;
      }
    }

    return {
      oil: totals[Category.Oil],
      parts: totals[Category.Parts],
      labour: totals[Category.Labour],
      grandTotal,
      maintenanceCostPerKm,
      fuelCostPerKm,
      fuelAverage
    };
  }, [entries]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold text-white">Expense Summary</h3>
        <div>
          <select
            value={selectedCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Select currency"
          >
            {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <SummaryRow label="Oil" amount={oil} currency={selectedCurrency} rates={exchangeRates} />
        <SummaryRow label="Parts" amount={parts} currency={selectedCurrency} rates={exchangeRates} />
        <SummaryRow label="Labour" amount={labour} currency={selectedCurrency} rates={exchangeRates} />
      </div>
      <div className="border-t border-gray-700 my-4"></div>
      <div className="flex justify-between items-center text-lg">
        <span className="font-bold text-white">Grand Total</span>
        <span className="font-bold text-green-400">
          {formatCurrency(grandTotal, selectedCurrency, exchangeRates)}
        </span>
      </div>

      {/* Analytics Section */}
      <div className="border-t border-gray-700 my-4 pt-4 space-y-3">
         <AnalyticsRow 
            label="Maintenance Cost / KM" 
            value={maintenanceCostPerKm !== null ? `${formatCurrency(maintenanceCostPerKm, selectedCurrency, exchangeRates, 2)} / km` : 'N/A'}
            helpText="Total cost of oil, parts, and labour divided by total kilometers traveled."
        />
         <AnalyticsRow 
            label="Fuel Cost / KM" 
            value={fuelCostPerKm !== null ? `${formatCurrency(fuelCostPerKm, selectedCurrency, exchangeRates, 2)} / km` : 'N/A'}
            helpText="Total fuel cost divided by total kilometers traveled."
        />
         <AnalyticsRow 
            label="Fuel Average" 
            value={fuelAverage !== null ? `${fuelAverage.toFixed(2)} km/L` : 'N/A'}
            helpText="Average kilometers per liter. Requires at least two fuel logs."
        />
      </div>
    </div>
  );
};

interface SummaryRowProps {
  label: string;
  amount: number;
  currency: Currency;
  rates: ExchangeRates;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, amount, currency, rates }) => (
  <div className="flex justify-between items-center text-gray-300">
    <span>{label}</span>
    <span className="font-mono">{formatCurrency(amount, currency, rates)}</span>
  </div>
);

interface AnalyticsRowProps {
    label: string;
    value: string;
    helpText: string;
}

const AnalyticsRow: React.FC<AnalyticsRowProps> = ({ label, value, helpText }) => (
    <div className="flex justify-between items-center text-gray-300 group relative">
        <span>{label}</span>
        <span className="font-mono font-semibold text-indigo-300">{value}</span>
        <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg">
            {helpText}
        </div>
    </div>
);