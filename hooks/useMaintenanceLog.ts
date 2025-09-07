import { useState, useEffect, useCallback } from 'react';
import type { MaintenanceEntry, Vehicle, ServiceIntervals } from '../types';
import { Category } from '../types';

const STORAGE_KEY = 'autoLogData';
const AUTO_BACKUP_STORAGE_KEY = 'autoLog_autoBackup';

// Fix: Moved MaintenanceData interface definition to be before its use.
interface MaintenanceData {
  vehicles: Vehicle[];
  entries: MaintenanceEntry[];
}

// Fix: Explicitly typed `initialData` to ensure its structure matches the `MaintenanceData` interface, resolving type errors.
const initialData: MaintenanceData = {
  vehicles: [
    { id: 1, name: 'Suzuki GD 110s', year: 2023, engineCc: 110 },
    { id: 2, name: 'Honda CG-125', year: 2024, engineCc: 125 },
    { id: 3, name: 'Toyota Corolla', year: 2021, engineCc: 1800 },
  ],
  entries: [
    // Suzuki GD 110s Entries (vehicleId: 1)
    { id: 1, vehicleId: 1, dateIso: '2023-10-15', odometerKm: 350, categories: [Category.Oil], description: 'First oil change (Suzuki Oil)', cost: 1250, status: 'logged' },
    { id: 2, vehicleId: 1, dateIso: '2023-10-15', odometerKm: 350, categories: [Category.Labour], description: 'First tuning and service', cost: 500, status: 'logged' },
    { id: 3, vehicleId: 1, dateIso: '2023-11-05', odometerKm: 950, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 4, vehicleId: 1, dateIso: '2023-11-20', odometerKm: 1850, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 5, vehicleId: 1, dateIso: '2023-11-20', odometerKm: 1850, categories: [Category.Labour], description: 'Tuning and general checkup', cost: 400, status: 'logged' },
    { id: 6, vehicleId: 1, dateIso: '2023-12-15', odometerKm: 2950, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 7, vehicleId: 1, dateIso: '2024-01-10', odometerKm: 4100, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 8, vehicleId: 1, dateIso: '2024-01-10', odometerKm: 4100, categories: [Category.Parts], description: 'Replaced air filter', cost: 550, status: 'logged' },
    { id: 9, vehicleId: 1, dateIso: '2024-01-10', odometerKm: 4100, categories: [Category.Labour], description: 'Full tuning', cost: 600, status: 'logged' },
    { id: 10, vehicleId: 1, dateIso: '2024-02-05', odometerKm: 5200, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 11, vehicleId: 1, dateIso: '2024-03-01', odometerKm: 6400, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 12, vehicleId: 1, dateIso: '2024-03-25', odometerKm: 7500, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 13, vehicleId: 1, dateIso: '2024-03-25', odometerKm: 7500, categories: [Category.Labour], description: 'General tuning', cost: 400, status: 'logged' },
    { id: 14, vehicleId: 1, dateIso: '2024-04-20', odometerKm: 8800, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 15, vehicleId: 1, dateIso: '2024-04-20', odometerKm: 8800, categories: [Category.Parts], description: 'Replaced oil filter', cost: 250, status: 'logged' },
    { id: 16, vehicleId: 1, dateIso: '2024-05-15', odometerKm: 10100, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1300, status: 'logged' },
    { id: 17, vehicleId: 1, dateIso: '2024-05-15', odometerKm: 10100, categories: [Category.Labour], description: 'Full tuning and carburetor clean', cost: 700, status: 'logged' },
    { id: 18, vehicleId: 1, dateIso: '2024-05-15', odometerKm: 10100, categories: [Category.Parts], description: 'Replaced spark plug', cost: 450, status: 'logged' },
    { id: 19, vehicleId: 1, dateIso: '2024-06-10', odometerKm: 11400, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1350, status: 'logged' },
    { id: 20, vehicleId: 1, dateIso: '2024-07-05', odometerKm: 12800, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1350, status: 'logged' },
    { id: 21, vehicleId: 1, dateIso: '2024-07-05', odometerKm: 12800, categories: [Category.Parts], description: 'Replaced front brake pads', cost: 800, status: 'logged' },
    { id: 22, vehicleId: 1, dateIso: '2024-07-28', odometerKm: 14200, categories: [Category.Oil], description: 'Oil change (Havoline)', cost: 1350, status: 'logged' },
    { id: 23, vehicleId: 1, dateIso: '2024-07-28', odometerKm: 14200, categories: [Category.Labour], description: 'Tuning and chain adjustment', cost: 500, status: 'logged' },
    
    // Fuel Entries - Suzuki
    { id: 101, vehicleId: 1, dateIso: '2024-07-01', odometerKm: 12650, categories: [Category.Fuel], description: 'Fuel top-up', cost: 1000, liters: 3.5, pricePerLiter: 285.71, status: 'logged' },
    { id: 102, vehicleId: 1, dateIso: '2024-07-08', odometerKm: 12950, categories: [Category.Fuel], description: 'Full tank', cost: 2500, liters: 8.8, pricePerLiter: 284.09, status: 'logged' },
    { id: 103, vehicleId: 1, dateIso: '2024-07-15', odometerKm: 13350, categories: [Category.Fuel], description: 'Fuel', cost: 1500, liters: 5.2, pricePerLiter: 288.46, status: 'logged' },
    { id: 104, vehicleId: 1, dateIso: '2024-07-22', odometerKm: 13800, categories: [Category.Fuel], description: 'Hi-Octane Mix', cost: 2000, liters: 6.5, pricePerLiter: 307.69, status: 'logged' },
    { id: 105, vehicleId: 1, dateIso: '2024-07-29', odometerKm: 14250, categories: [Category.Fuel], description: 'Regular fuel', cost: 1200, liters: 4.1, pricePerLiter: 292.68, status: 'logged' },

    // Toyota Corolla Entry (vehicleId: 3)
    { id: 201, vehicleId: 3, dateIso: '2024-05-01', odometerKm: 15000, categories: [Category.Oil, Category.Parts], description: 'Oil and filter change (synthetic)', cost: 8000, status: 'logged' },
  ],
};

// Helper to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateToIso = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

export const useMaintenanceLog = () => {
  const [data, setData] = useState<MaintenanceData>({ vehicles: [], entries: [] });

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.entries) {
            // Data migration for status and category fields
            parsedData.entries = parsedData.entries.map((e: any) => {
                const migratedEntry: MaintenanceEntry = {
                    ...e,
                    status: e.status || 'logged',
                    categories: e.categories || (e.category ? [e.category] : [Category.Other])
                };
                delete (migratedEntry as any).category; // Remove old field
                return migratedEntry;
            });
        }
        if (parsedData.vehicles && parsedData.entries) {
            setData(parsedData);
            return;
        }
      }
      // Load initial hardcoded data if local storage is empty or invalid
      setData(initialData);
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      setData(initialData);
    }
  }, []);

  useEffect(() => {
    try {
      if (data.vehicles.length > 0 || data.entries.length > 0) {
        // Main save operation
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Automatic backup snapshot
        const autoBackupData = {
            timestamp: new Date().toISOString(),
            data: data
        };
        localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(autoBackupData));
      }
    } catch (error) {
      console.error('Failed to save data to localStorage', error);
    }
  }, [data]);
  
  const addVehicle = useCallback((name: string, year: number | undefined, engineCc: number | undefined) => {
    setData(prevData => {
        const newVehicle: Vehicle = { id: Date.now(), name, year, engineCc };
        return { ...prevData, vehicles: [...prevData.vehicles, newVehicle]};
    });
  }, []);

  const updateVehicle = useCallback((id: number, updatedData: Partial<Omit<Vehicle, 'id'>>) => {
    setData(prevData => ({
        ...prevData,
        vehicles: prevData.vehicles.map(v =>
            v.id === id ? { ...v, ...updatedData } : v
        ),
    }));
  }, []);

  const deleteVehicle = useCallback((id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle and all its maintenance history?')) {
        setData(prevData => ({
            vehicles: prevData.vehicles.filter(v => v.id !== id),
            entries: prevData.entries.filter(e => e.vehicleId !== id),
        }));
    }
  }, []);

  const saveVehicleIntervals = useCallback((vehicleId: number, intervals: ServiceIntervals) => {
    setData(prevData => ({
        ...prevData,
        vehicles: prevData.vehicles.map(v => 
            v.id === vehicleId ? { ...v, intervals } : v
        ),
    }));
  }, []);

  const createScheduledEntry = (loggedEntry: MaintenanceEntry): MaintenanceEntry | null => {
    if (!loggedEntry.isRecurring) return null;

    const { recurrenceIntervalDays, recurrenceIntervalKm } = loggedEntry;
    if (!recurrenceIntervalDays && !recurrenceIntervalKm) return null;

    const nextDate = recurrenceIntervalDays 
        ? formatDateToIso(addDays(new Date(`${loggedEntry.dateIso}T00:00:00`), recurrenceIntervalDays))
        : loggedEntry.dateIso;

    const nextOdometer = recurrenceIntervalKm
        ? loggedEntry.odometerKm + recurrenceIntervalKm
        : loggedEntry.odometerKm;

    return {
        ...loggedEntry,
        id: Date.now(),
        dateIso: nextDate,
        odometerKm: nextOdometer,
        cost: 0,
        status: 'scheduled',
        parentId: loggedEntry.id,
    };
  }

  const addEntry = useCallback((newEntryData: Omit<MaintenanceEntry, 'id'>) => {
    setData(prevData => {
      const entryToAdd: MaintenanceEntry = { ...newEntryData, id: Date.now() };
      const newEntries = [...prevData.entries, entryToAdd];
      
      const scheduled = createScheduledEntry(entryToAdd);
      if (scheduled) {
          newEntries.push(scheduled);
      }

      return { ...prevData, entries: newEntries };
    });
  }, []);

  const addMultipleEntries = useCallback((newEntriesData: Omit<MaintenanceEntry, 'id'>[]) => {
    setData(prevData => {
        const newIdBase = Date.now();
        const entriesToAdd: MaintenanceEntry[] = newEntriesData.map((entryData, index) => ({
            ...entryData,
            id: newIdBase + index,
        }));
        
        // Note: This simplified batch-add does not trigger recurrence scheduling.
        // This is acceptable for AI-generated entries.
        
        return { ...prevData, entries: [...prevData.entries, ...entriesToAdd] };
    });
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setData(prevData => {
      const entryToDelete = prevData.entries.find(e => e.id === id);
      if (!entryToDelete) return prevData;

      // Find any scheduled entries that were created by this entry
      const childScheduledEntry = prevData.entries.find(e => e.parentId === id);
      
      const entriesToKeep = prevData.entries.filter(entry => {
          // Remove the entry itself
          if (entry.id === id) return false;
          // Remove its direct child scheduled entry
          if (childScheduledEntry && entry.id === childScheduledEntry.id) return false;
          return true;
      });

      return { ...prevData, entries: entriesToKeep };
    });
  }, []);
  
  const updateEntry = useCallback((updatedEntry: MaintenanceEntry) => {
    setData(prevData => {
      const oldEntry = prevData.entries.find(e => e.id === updatedEntry.id);
      const childScheduledEntry = prevData.entries.find(e => e.parentId === updatedEntry.id);
      let newEntries = [...prevData.entries];

      // Update the main entry
      newEntries = newEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry);

      // Handle changes to recurrence
      const newScheduled = createScheduledEntry(updatedEntry);

      if (childScheduledEntry) { // If a scheduled entry already exists
        if (newScheduled) { // and should continue to exist, update it
          newEntries = newEntries.map(e => e.id === childScheduledEntry.id ? { ...newScheduled, id: childScheduledEntry.id } : e);
        } else { // but should no longer exist, remove it
          newEntries = newEntries.filter(e => e.id !== childScheduledEntry.id);
        }
      } else if (newScheduled) { // If one didn't exist but should now, add it
        newEntries.push(newScheduled);
      }
      
      return { ...prevData, entries: newEntries };
    });
  }, []);

  const completeScheduledEntry = useCallback((entryToComplete: MaintenanceEntry) => {
    setData(prevData => {
        // 1. Update the scheduled entry to be a logged entry
        const completedEntry: MaintenanceEntry = {
            ...entryToComplete,
            status: 'logged',
        };
        let newEntries = prevData.entries.map(e => e.id === completedEntry.id ? completedEntry : e);

        // 2. Create the next scheduled entry if it's still recurring
        const nextScheduled = createScheduledEntry(completedEntry);
        if (nextScheduled) {
            newEntries.push(nextScheduled);
        }

        return { ...prevData, entries: newEntries };
    });
  }, []);

  // Function to overwrite the entire state, for restore purposes
  const setMaintenanceData = useCallback((newData: MaintenanceData) => {
    // Ensure all entries from backup have a status
    if (newData.entries) {
        newData.entries = newData.entries.map((e: any) => {
            const migratedEntry: MaintenanceEntry = {
                ...e,
                status: e.status || 'logged',
                categories: e.categories || (e.category ? [e.category] : [Category.Other])
            };
            delete (migratedEntry as any).category;
            return migratedEntry;
        });
    }
    setData(newData as MaintenanceData);
  }, []);
  
  const restoreFromAutoBackup = useCallback(() => {
    if (window.confirm('Are you sure you want to restore from the last automatic backup? Any changes made since your last session may be lost.')) {
        try {
            const backupJson = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY);
            if (!backupJson) {
                alert('No automatic backup found.');
                return;
            }
            const backup = JSON.parse(backupJson);
            if (backup.data) {
                setMaintenanceData(backup.data);
                alert('Data restored successfully from automatic backup.');
            } else {
                throw new Error('Invalid backup file format.');
            }
        } catch (e) {
             alert(`Error restoring from auto-backup: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
  }, [setMaintenanceData]);
  
  const clearMaintenanceData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY);
  }, []);


  return { ...data, addEntry, addMultipleEntries, deleteEntry, updateEntry, addVehicle, updateVehicle, deleteVehicle, saveVehicleIntervals, completeScheduledEntry, setMaintenanceData, restoreFromAutoBackup, clearMaintenanceData };
};