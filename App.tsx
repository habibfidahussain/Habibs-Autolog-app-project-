import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { MaintenanceList } from './components/MaintenanceList';
import { AddEntryModal } from './components/AddEntryModal';
import { MaintenanceAlerts } from './components/MaintenanceAlerts';
import { ManageVehiclesModal } from './components/ManageVehiclesModal';
import { VehicleSettingsModal } from './components/VehicleSettingsModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { HelpModal } from './components/HelpModal';
import { MaintenanceGuideModal } from './components/MaintenanceGuideModal';
import { PartIdentifierModal } from './components/PartIdentifierModal';
import { OdometerScannerModal } from './components/OdometerScannerModal';
import { RefuelScannerModal } from './components/FuelPumpScannerModal';
import { NavBar, Page } from './components/NavBar';
import { FuelLog } from './components/FuelLog';
import { AnalysisPage } from './components/AnalysisPage';
import { CategoryFilter } from './components/CategoryFilter';
import { HistoryFilters } from './components/HistoryFilters';
import { ExportModal } from './components/ExportModal';
import { AIToolCard } from './components/AIToolCard';
import { useMaintenanceLog } from './hooks/useMaintenanceLog';
import { useMaintenanceAlerts } from './hooks/useMaintenanceAlerts';
import { useCurrency } from './hooks/useCurrency';
import type { MaintenanceEntry, ServiceIntervals, Vehicle, ExchangeRates, Currency, ExportOptions, DateRangePreset, OdometerRange } from './types';
import { Category } from './types';
import { exportMaintenanceToCsv, exportFuelToCsv } from './utils/csvExporter';
import { isFuzzyMatch } from './utils/fuzzySearch';

export interface GroupedEntry {
  dateIso: string;
  odometerKm: number;
  entries: MaintenanceEntry[];
}

export interface BackupData {
    vehicles: Vehicle[];
    entries: MaintenanceEntry[];
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

interface ScannedFuelData {
    cost: number | null;
    liters: number | null;
    pricePerLiter: number | null;
}

type SortOption = 'date_desc' | 'odometer_desc';
type OdometerScanTarget = 'status' | 'modal';


const App: React.FC = () => {
  const { vehicles, entries, addEntry, addMultipleEntries, deleteEntry, updateEntry, completeScheduledEntry, addVehicle, updateVehicle, deleteVehicle, saveVehicleIntervals, setMaintenanceData, restoreFromAutoBackup, clearMaintenanceData } = useMaintenanceLog();
  const { selectedCurrency, exchangeRates, selectCurrency, updateRates, setCurrencyData, clearCurrencyData } = useCurrency();
  
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isManageVehiclesModalOpen, setIsManageVehiclesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPartIdentifierModalOpen, setIsPartIdentifierModalOpen] = useState(false);
  const [isOdometerScannerModalOpen, setIsOdometerScannerModalOpen] = useState(false);
  const [isRefuelScannerOpen, setIsRefuelScannerOpen] = useState(false);
  
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null);
  const [scannedFuelData, setScannedFuelData] = useState<ScannedFuelData | null>(null);
  const [initialModalCategory, setInitialModalCategory] = useState<Category | null>(null);

  const [currentVehicleId, setCurrentVehicleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('status');
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRangePreset>('all');
  const [odometerFilter, setOdometerFilter] = useState<OdometerRange>({ min: '', max: '' });
  const [odometerCheckValue, setOdometerCheckValue] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // State for managing odometer scan context
  const [odometerScanTarget, setOdometerScanTarget] = useState<OdometerScanTarget>('status');
  const [scannedOdometerForModal, setScannedOdometerForModal] = useState<number | null>(null);

  useEffect(() => {
    if (!currentVehicleId && vehicles.length > 0) {
      setCurrentVehicleId(vehicles[0].id);
    }
  }, [vehicles, currentVehicleId]);

  const currentVehicle = useMemo(() => vehicles.find(v => v.id === currentVehicleId), [vehicles, currentVehicleId]);

  const currentVehicleEntries = useMemo(() => {
    if (!currentVehicleId) return [];
    // Only return logged and scheduled, filter out fuel for main maintenance view
    return entries.filter(entry => entry.vehicleId === currentVehicleId && !(entry.categories?.includes(Category.Fuel)));
  }, [entries, currentVehicleId]);

  const loggedEntries = useMemo(() => entries.filter(e => e.vehicleId === currentVehicleId && e.status === 'logged'), [entries, currentVehicleId]);
  const latestOdometer = useMemo(() => {
     if (loggedEntries.length === 0) return 0;
     return Math.max(...loggedEntries.map(e => e.odometerKm));
  }, [loggedEntries]);
  
  const fuelEntries = useMemo(() => loggedEntries.filter(e => e.categories?.includes(Category.Fuel)), [loggedEntries]);
  const allVehicleEntriesForAlerts = useMemo(() => entries.filter(entry => entry.vehicleId === currentVehicleId), [entries, currentVehicleId]);

  // Use the user's specific check value if provided, otherwise default to the latest known odometer.
  const odometerForAlerts = odometerCheckValue ?? (latestOdometer > 0 ? latestOdometer : null);
  const alerts = useMaintenanceAlerts(allVehicleEntriesForAlerts, odometerForAlerts, currentVehicle || null);

  const filteredMaintenanceEntries = useMemo(() => {
    let filtered = currentVehicleEntries;

    // 1. Apply category filter
    if (categoryFilter) {
        filtered = filtered.filter(entry => entry.categories?.includes(categoryFilter));
    }

    // 2. Apply date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (dateFilter === 'last_30_days') {
        startDate.setDate(now.getDate() - 30);
      } else if (dateFilter === 'last_90_days') {
        startDate.setDate(now.getDate() - 90);
      } else if (dateFilter === 'last_year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const startDateIso = startDate.toISOString().split('T')[0];
      filtered = filtered.filter(entry => entry.dateIso >= startDateIso);
    }
    
    // 3. Apply odometer filter
    const minOdo = parseFloat(odometerFilter.min);
    const maxOdo = parseFloat(odometerFilter.max);

    if (!isNaN(minOdo) || !isNaN(maxOdo)) {
      filtered = filtered.filter(entry => {
        const isAfterMin = isNaN(minOdo) || entry.odometerKm >= minOdo;
        const isBeforeMax = isNaN(maxOdo) || entry.odometerKm <= maxOdo;
        return isAfterMin && isBeforeMax;
      });
    }

    // 4. Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry => {
        const isNumericMatch = String(entry.cost).includes(searchQuery) ||
                               String(entry.odometerKm).includes(searchQuery);
        
        const isTextMatch = isFuzzyMatch(searchQuery, entry.description) ||
                            (entry.categories || []).some(c => isFuzzyMatch(searchQuery, c));

        return isNumericMatch || isTextMatch;
      });
    }
    
    // 5. Apply final sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'odometer_desc') {
        if (a.odometerKm === b.odometerKm) return a.status === 'scheduled' ? -1 : 1;
        return b.odometerKm - a.odometerKm;
      }
      // Default to date_desc
      const dateA = new Date(a.dateIso).getTime();
      const dateB = new Date(b.dateIso).getTime();
      if (dateA === dateB) return b.odometerKm - a.odometerKm; // Secondary sort by KM
      return dateB - dateA;
    });

  }, [currentVehicleEntries, searchQuery, categoryFilter, sortBy, dateFilter, odometerFilter]);

  const groupEntries = (entriesToGroup: MaintenanceEntry[]): GroupedEntry[] => {
    const groups: Map<string, GroupedEntry> = new Map();
    for (const entry of entriesToGroup) {
        const key = `${entry.dateIso}-${entry.odometerKm}`; // Group by date and odometer
        if (!groups.has(key)) {
            groups.set(key, { dateIso: entry.dateIso, odometerKm: entry.odometerKm, entries: [] });
        }
        groups.get(key)!.entries.push(entry);
    }
    return Array.from(groups.values());
  };

  const groupedMaintenanceEntries = useMemo(() => groupEntries(filteredMaintenanceEntries), [filteredMaintenanceEntries]);
  const groupedFuelEntries = useMemo(() => groupEntries(fuelEntries), [fuelEntries]);

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setScannedFuelData(null);
    setInitialModalCategory(null);
    setIsAddEntryModalOpen(true);
  };
  
  const handleOpenLogFuelModal = () => {
    setEditingEntry(null);
    setScannedFuelData(null);
    setInitialModalCategory(Category.Fuel);
    setIsAddEntryModalOpen(true);
  };

  const handleOpenEditModal = (entry: MaintenanceEntry) => {
    setEditingEntry(entry);
    setScannedFuelData(null);
    setInitialModalCategory(null);
    setIsAddEntryModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddEntryModalOpen(false);
    setEditingEntry(null);
    setScannedFuelData(null);
    setInitialModalCategory(null);
  };

  const handleSaveEntry = (entryData: Omit<MaintenanceEntry, 'vehicleId'>) => {
    if (!currentVehicleId) return;

    const entryWithVehicle = { ...entryData, vehicleId: currentVehicleId };

    if (entryData.status === 'scheduled') {
        // This case should not be hit if modal logic is correct, but as a fallback
        completeScheduledEntry(entryWithVehicle);
    } else if (editingEntry) {
      updateEntry(entryWithVehicle);
    } else {
      addEntry(entryWithVehicle);
    }
    handleCloseModal();
  };
  
  const handleSaveMultipleEntries = (entriesData: Omit<MaintenanceEntry, 'id' | 'vehicleId'>[]) => {
    if (!currentVehicleId) return;

    const entriesWithVehicle = entriesData.map(e => ({ ...e, vehicleId: currentVehicleId }));
    addMultipleEntries(entriesWithVehicle);
    
    handleCloseModal();
  };

  const handleSaveVehicleSettings = (intervals: ServiceIntervals) => {
    if (currentVehicle) {
      saveVehicleIntervals(currentVehicle.id, intervals);
      setIsSettingsModalOpen(false);
    }
  };

  const handleDeleteEntry = (id: number) => {
    deleteEntry(id);
  };
  
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };
  
  const handleConfirmExport = (options: ExportOptions) => {
    if (!currentVehicle) return;
    const vehicleName = currentVehicle.name.toLowerCase().replace(/\s/g, '-');
    const date = new Date().toISOString().split('T')[0];

    if (options.maintenance) {
      const maintenanceToExport = entries.filter(e => e.vehicleId === currentVehicleId && !e.categories.includes(Category.Fuel));
      exportMaintenanceToCsv(maintenanceToExport, `${vehicleName}-maintenance-log-${date}.csv`);
    }
    if (options.fuel) {
      exportFuelToCsv(fuelEntries, `${vehicleName}-fuel-log-${date}.csv`);
    }
    setIsExportModalOpen(false);
  };

  const handleSelectVehicle = (id: number) => {
    setCurrentVehicleId(id);
    setSearchQuery('');
    setCategoryFilter(null);
    setSortBy('date_desc');
    setDateFilter('all');
    setOdometerFilter({ min: '', max: '' });
    setCurrentPage('history');
  };

  const handleDeleteVehicle = (id: number) => {
    deleteVehicle(id);
    if (currentVehicleId === id) {
        const newCurrent = vehicles.find(v => v.id !== id);
        setCurrentVehicleId(newCurrent ? newCurrent.id : null);
    }
  }

  const handleRestore = (data: BackupData) => {
    if (window.confirm('Are you sure you want to restore? This will overwrite all current data.')) {
        try {
            // Basic validation
            if (!data.vehicles || !data.entries || !data.selectedCurrency || !data.exchangeRates) {
                throw new Error('Invalid backup file format.');
            }
            setMaintenanceData({ vehicles: data.vehicles, entries: data.entries });
            setCurrencyData({ selectedCurrency: data.selectedCurrency, exchangeRates: data.exchangeRates });
            // Reset current vehicle to the first one in the restored data
            setCurrentVehicleId(data.vehicles[0]?.id || null);
            setIsAppSettingsModalOpen(false);
            alert('Data restored successfully!');
        } catch(e) {
            alert(`Error restoring data: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
  };
  
  const handleResetApp = () => {
    if (window.confirm('Are you absolutely sure? This will permanently delete all your vehicles and maintenance history. This action cannot be undone.')) {
        clearMaintenanceData();
        clearCurrencyData();
        alert('App data has been reset. The application will now reload.');
        window.location.reload();
    }
  };
  
  const handleOdometerScanned = (odometer: number) => {
    if (odometerScanTarget === 'status') {
      setOdometerCheckValue(odometer);
    } else {
      setScannedOdometerForModal(odometer);
    }
    setIsOdometerScannerModalOpen(false);
  };
  
  const handleInitiateOdometerScanForStatus = () => {
    setOdometerScanTarget('status');
    setIsOdometerScannerModalOpen(true);
  };
  
  const handleInitiateOdometerScanForModal = () => {
    setOdometerScanTarget('modal');
    setScannedOdometerForModal(null); // Clear previous value before new scan
    setIsOdometerScannerModalOpen(true);
  };
  
  const handleOdometerScanConsumed = () => {
    setScannedOdometerForModal(null);
  };

  const handleRefuelScanned = (data: ScannedFuelData) => {
    setScannedFuelData(data);
    setIsRefuelScannerOpen(false);
    setEditingEntry(null);
    setInitialModalCategory(null);
    setIsAddEntryModalOpen(true);
  };
  
  const handleInitiateRefuelScan = () => {
    setIsAddEntryModalOpen(false);
    setIsRefuelScannerOpen(true);
  };
  
  const handleDirectRefuelScan = () => {
    setEditingEntry(null);
    setScannedFuelData(null);
    setInitialModalCategory(null);
    setIsRefuelScannerOpen(true);
  };


  if (!currentVehicle) {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
             <div className="text-center">
                <h1 className="text-3xl font-bold mb-2 text-white">AutoLog</h1>
                <p className="text-lg text-gray-400 mb-6">A smart logbook for all your vehicle maintenance.</p>
                <p className="text-gray-400 mb-8">Add a vehicle to get started.</p>
                <button 
                    onClick={() => setIsManageVehiclesModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Add Your First Vehicle
                </button>
                {isManageVehiclesModalOpen && (
                    <ManageVehiclesModal
                        vehicles={vehicles}
                        onClose={() => setIsManageVehiclesModalOpen(false)}
                        onAddVehicle={addVehicle}
                        onUpdateVehicle={updateVehicle}
                        onDeleteVehicle={handleDeleteVehicle}
                    />
                )}
            </div>
        </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
        case 'status':
            return (
                <div className="space-y-6">
                    <MaintenanceAlerts 
                        alerts={alerts}
                        odometerCheckValue={odometerCheckValue}
                        latestLoggedOdometer={latestOdometer}
                        onOdometerUpdate={setOdometerCheckValue}
                        onScanOdometerClick={handleInitiateOdometerScanForStatus}
                    />
                </div>
            );
        case 'ai_assistant':
            return (
                <AIToolCard
                    onIdentifyPartClick={() => setIsPartIdentifierModalOpen(true)}
                    onScanRefuelClick={handleDirectRefuelScan}
                />
            );
        case 'summary':
            return (
                <div className="space-y-6">
                    <SummaryCard 
                        entries={loggedEntries} 
                        selectedCurrency={selectedCurrency}
                        exchangeRates={exchangeRates}
                        onCurrencyChange={selectCurrency}
                    />
                </div>
            );
        case 'fuel':
            return (
                 <FuelLog
                    groups={groupedFuelEntries}
                    onDelete={handleDeleteEntry}
                    onEdit={handleOpenEditModal}
                    selectedCurrency={selectedCurrency}
                    exchangeRates={exchangeRates}
                />
            );
        case 'stats':
             return (
                <AnalysisPage 
                    loggedEntries={loggedEntries}
                    selectedCurrency={selectedCurrency}
                    exchangeRates={exchangeRates}
                />
            );
        case 'history':
        default:
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-200">History</h2>
                        <button
                            onClick={handleOpenExportModal}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg"
                        >
                            <ExportIcon />
                            <span>Export</span>
                        </button>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-xl shadow-lg space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by description, category, cost, or KM..."
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        
                        <button
                            onClick={() => setIsFilterVisible(!isFilterVisible)}
                            className="flex items-center justify-between w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-expanded={isFilterVisible}
                            aria-controls="filter-section"
                        >
                            <div className="flex items-center gap-2">
                                <FilterIcon />
                                <span className="font-semibold text-gray-200">Filter & Sort Options</span>
                            </div>
                            <ChevronDownIcon className={isFilterVisible ? 'rotate-180' : ''} />
                        </button>
                        
                        <div
                            id="filter-section"
                            className={`grid transition-all duration-500 ease-in-out ${isFilterVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                            <div className="overflow-hidden">
                                <div className="space-y-4 pt-4 mt-4 border-t border-gray-700">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Sort by</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="date_desc">Date: Newest First</option>
                                            <option value="odometer_desc">Odometer: Highest First</option>
                                        </select>
                                    </div>
                                    <HistoryFilters
                                        dateFilter={dateFilter}
                                        onDateFilterChange={setDateFilter}
                                        odometerFilter={odometerFilter}
                                        onOdometerFilterChange={setOdometerFilter}
                                    />
                                    <CategoryFilter
                                        selectedCategory={categoryFilter}
                                        onSelectCategory={setCategoryFilter}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <MaintenanceList 
                        groups={groupedMaintenanceEntries} 
                        onDelete={handleDeleteEntry}
                        onEdit={handleOpenEditModal}
                        searchQuery={searchQuery}
                        selectedCurrency={selectedCurrency}
                        exchangeRates={exchangeRates}
                    />
                </div>
            );
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto max-w-2xl p-4">
        <Header 
          vehicles={vehicles}
          currentVehicle={currentVehicle}
          onSelectVehicle={handleSelectVehicle}
          onAddEntryClick={handleOpenAddModal} 
          onManageVehiclesClick={() => setIsManageVehiclesModalOpen(true)}
          onVehicleSettingsClick={() => setIsSettingsModalOpen(true)}
          onAppSettingsClick={() => setIsAppSettingsModalOpen(true)}
          onHelpClick={() => setIsHelpModalOpen(true)}
          onMaintenanceGuideClick={() => setIsGuideModalOpen(true)}
          onLogFuelClick={handleOpenLogFuelModal}
        />
        <NavBar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="mt-6">
            {renderCurrentPage()}
        </main>
      </div>

      {isAddEntryModalOpen && (
        <AddEntryModal
          entry={editingEntry}
          onClose={handleCloseModal}
          onSave={handleSaveEntry}
          onSaveMultiple={handleSaveMultipleEntries}
          initialData={scannedFuelData}
          initialCategory={initialModalCategory}
          onInitiateRefuelScan={handleInitiateRefuelScan}
          scannedOdometer={scannedOdometerForModal}
          onInitiateOdometerScan={handleInitiateOdometerScanForModal}
          onOdometerScanConsumed={handleOdometerScanConsumed}
        />
      )}
      
      {isManageVehiclesModalOpen && (
        <ManageVehiclesModal
          vehicles={vehicles}
          onClose={() => setIsManageVehiclesModalOpen(false)}
          onAddVehicle={addVehicle}
          onUpdateVehicle={updateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
        />
      )}
      
      {isSettingsModalOpen && currentVehicle && (
        <VehicleSettingsModal 
          vehicle={currentVehicle}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveVehicleSettings}
        />
      )}

      {isAppSettingsModalOpen && (
        <AppSettingsModal
          initialRates={exchangeRates}
          onClose={() => setIsAppSettingsModalOpen(false)}
          onSaveRates={updateRates}
          onRestore={handleRestore}
          onRestoreFromAutoBackup={restoreFromAutoBackup}
          getBackupData={() => ({ vehicles, entries, selectedCurrency, exchangeRates })}
          onResetApp={handleResetApp}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
            onClose={() => setIsExportModalOpen(false)}
            onConfirm={handleConfirmExport}
        />
      )}

      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
      
      {isGuideModalOpen && currentVehicle && (
        <MaintenanceGuideModal vehicle={currentVehicle} onClose={() => setIsGuideModalOpen(false)} />
      )}

      {isPartIdentifierModalOpen && <PartIdentifierModal onClose={() => setIsPartIdentifierModalOpen(false)} />}
      
      {isOdometerScannerModalOpen && (
        <OdometerScannerModal 
            onClose={() => setIsOdometerScannerModalOpen(false)}
            onOdometerScanned={handleOdometerScanned}
        />
      )}

      {isRefuelScannerOpen && (
        <RefuelScannerModal 
            onClose={() => setIsRefuelScannerOpen(false)}
            onRefuelDataScanned={handleRefuelScanned}
        />
      )}

    </div>
  );
};

// --- Helper Icon Components ---

const ExportIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const FilterIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);


export default App;