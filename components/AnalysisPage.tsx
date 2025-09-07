import React, { useMemo, useState } from 'react';
import type { MaintenanceEntry, Currency, ExchangeRates } from '../types';
import { Category } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { LineChart, ChartDataPoint } from './LineChart';
import { PieChart, PieChartDataPoint } from './PieChart';

interface AnalysisPageProps {
  loggedEntries: MaintenanceEntry[];
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

type AnalysisTab = 'maintenance' | 'fuel';

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ loggedEntries, selectedCurrency, exchangeRates }) => {
    const [activeTab, setActiveTab] = useState<AnalysisTab>('maintenance');

    const fuelEntries = useMemo(() => loggedEntries.filter(e => e.categories.includes(Category.Fuel)), [loggedEntries]);
    const maintenanceEntries = useMemo(() => loggedEntries.filter(e => !e.categories.includes(Category.Fuel)), [loggedEntries]);

    const renderContent = () => {
        if (activeTab === 'maintenance') {
            return <MaintenanceAnalysis maintenanceEntries={maintenanceEntries} selectedCurrency={selectedCurrency} exchangeRates={exchangeRates} />;
        }
        if (activeTab === 'fuel') {
            return <FuelAnalysis fuelEntries={fuelEntries} selectedCurrency={selectedCurrency} exchangeRates={exchangeRates} />;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200">Cost Analysis</h2>
            
            <div className="bg-gray-800 p-1.5 rounded-lg flex gap-1.5">
                <TabButton label="Maintenance" isActive={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} />
                <TabButton label="Fuel" isActive={activeTab === 'fuel'} onClick={() => setActiveTab('fuel')} />
            </div>

            {renderContent()}
        </div>
    );
};

// --- Maintenance Analysis Component ---
const MaintenanceAnalysis: React.FC<Pick<AnalysisPageProps, 'selectedCurrency' | 'exchangeRates'> & { maintenanceEntries: MaintenanceEntry[] }> = ({ maintenanceEntries, selectedCurrency, exchangeRates }) => {
    const { stats, pieData } = useMemo(() => {
        if (maintenanceEntries.length < 1) {
            return { stats: { totalSpent: 0, costPerKm: 0 }, pieData: [] };
        }

        const totals: { [key in Category]?: number } = {};
        let minOdometer = Infinity;
        let maxOdometer = 0;

        maintenanceEntries.forEach(entry => {
            const maintCategories = entry.categories.filter(c => c !== Category.Fuel);
            const costPerCat = entry.cost / (maintCategories.length || 1);
            maintCategories.forEach(cat => {
                totals[cat] = (totals[cat] || 0) + costPerCat;
            });
            if (entry.odometerKm < minOdometer) minOdometer = entry.odometerKm;
            if (entry.odometerKm > maxOdometer) maxOdometer = entry.odometerKm;
        });

        const totalSpent = Object.values(totals).reduce((sum, val) => sum + (val || 0), 0);
        const totalDistance = maxOdometer > minOdometer ? maxOdometer - minOdometer : 0;
        const costPerKm = totalDistance > 0 ? totalSpent / totalDistance : 0;

        const pieChartData: PieChartDataPoint[] = Object.entries(totals).map(([label, value]) => ({
            label: label as Category,
            value: value || 0,
        })).filter(d => d.value > 0);

        return { stats: { totalSpent, costPerKm }, pieData: pieChartData };
    }, [maintenanceEntries]);

    if (maintenanceEntries.length < 1) {
        return <EmptyState message="Log at least one maintenance entry (e.g., Oil, Parts) to see an analysis." />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Maintenance Cost" value={formatCurrency(stats.totalSpent, selectedCurrency, exchangeRates)} />
                <StatCard label="Maintenance Cost / KM" value={`${formatCurrency(stats.costPerKm, selectedCurrency, exchangeRates, 2)}`} />
            </div>
            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Maintenance Cost Breakdown</h3>
                <div className="h-64">
                    <PieChart data={pieData} currency={selectedCurrency} rates={exchangeRates} />
                </div>
            </div>
        </div>
    );
};


// --- Fuel Analysis Component ---
const FuelAnalysis: React.FC<Pick<AnalysisPageProps, 'selectedCurrency' | 'exchangeRates'> & { fuelEntries: MaintenanceEntry[] }> = ({ fuelEntries, selectedCurrency, exchangeRates }) => {
    const stats = useMemo(() => {
        if (fuelEntries.length === 0) {
            return { totalSpent: 0, totalLiters: 0, avgCostPerFill: 0, avgPricePerLiter: 0 };
        }
        const totalSpent = fuelEntries.reduce((sum, entry) => sum + entry.cost, 0);
        const totalLiters = fuelEntries.reduce((sum, entry) => sum + (entry.liters || 0), 0);
        return {
            totalSpent,
            totalLiters,
            avgCostPerFill: totalSpent / fuelEntries.length,
            avgPricePerLiter: totalLiters > 0 ? totalSpent / totalLiters : 0,
        };
    }, [fuelEntries]);

    const chartData = useMemo<ChartDataPoint[]>(() => {
        const dailyCosts = new Map<string, number>();
        fuelEntries.forEach(entry => {
            dailyCosts.set(entry.dateIso, (dailyCosts.get(entry.dateIso) || 0) + entry.cost);
        });
        return Array.from(dailyCosts.entries())
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fuelEntries]);

    if (fuelEntries.length < 2) {
        return <EmptyState message="Log at least two fuel entries to generate a fuel analysis and chart." />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Fuel Spent" value={formatCurrency(stats.totalSpent, selectedCurrency, exchangeRates)} />
                <StatCard label="Total Liters" value={`${stats.totalLiters.toFixed(2)} L`} />
                <StatCard label="Avg. Cost / Fill" value={formatCurrency(stats.avgCostPerFill, selectedCurrency, exchangeRates)} />
                <StatCard label="Avg. Price / Liter" value={formatCurrency(stats.avgPricePerLiter, selectedCurrency, exchangeRates, 2)} />
            </div>
            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Fuel Cost Over Time</h3>
                <div className="h-64">
                    <LineChart data={chartData} currency={selectedCurrency} rates={exchangeRates} />
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---
interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}
const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:ring-indigo-500 ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        aria-current={isActive}
    >
        {label}
    </button>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
        <h3 className="text-xl font-semibold text-white">Not Enough Data for Analysis</h3>
        <p className="text-gray-400 mt-2">{message}</p>
    </div>
);

interface StatCardProps {
    label: string;
    value: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-indigo-300 mt-1">{value}</p>
    </div>
);