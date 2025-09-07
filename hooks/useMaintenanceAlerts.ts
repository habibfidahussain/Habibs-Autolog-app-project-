import { useMemo } from 'react';
import type { MaintenanceEntry, MaintenanceAlert, AlertStatus, Vehicle } from '../types';
import { SERVICE_INTERVALS, DUE_SOON_THRESHOLD } from '../constants';

// Helper to find the last service entry based on keywords. Assumes entries are sorted descending.
const findLastService = (sortedEntries: MaintenanceEntry[], keywords: string[]): MaintenanceEntry | null => {
  for (const entry of sortedEntries) {
    const description = entry.description.toLowerCase();
    if (keywords.some(keyword => description.includes(keyword))) {
      return entry;
    }
  }
  return null;
};

// Generates simple keywords from a task name for searching.
const getKeywordsForTask = (taskName: string): string[] => {
    const lowerCaseName = taskName.toLowerCase();
    const keywords = [lowerCaseName];

    // Add common alternatives for better matching
    if (lowerCaseName.includes('spark plug')) {
        keywords.push('plugs');
    }
    if (lowerCaseName.includes('engine oil') || lowerCaseName.includes('oil change')) {
        keywords.push('oil');
    }
    
    return keywords;
}


export const useMaintenanceAlerts = (
  allEntries: MaintenanceEntry[],
  currentOdometer: number | null,
  currentVehicle: Vehicle | null
): MaintenanceAlert[] => {
  const intervals = useMemo(() => {
    const defaults = SERVICE_INTERVALS['DEFAULT'];
    if (!currentVehicle) return defaults;
    
    const vehiclePreset = SERVICE_INTERVALS[currentVehicle.name] || {};
    const customIntervals = currentVehicle.intervals || {};

    // Precedence: Custom > Preset > Default
    return {
      ...defaults,
      ...vehiclePreset,
      ...customIntervals,
    };
  }, [currentVehicle]);

  return useMemo(() => {
    if (!currentVehicle || currentOdometer === null) return [];

    // Ensure entries are sorted to reliably find the *last* service
    const sortedEntries = [...allEntries].sort((a, b) => b.odometerKm - a.odometerKm);

    const loggedEntries = sortedEntries.filter(e => e.status === 'logged');
    const scheduledEntries = sortedEntries.filter(e => e.status === 'scheduled');
    
    const alerts: MaintenanceAlert[] = [];
    
    // --- Primary source of alerts: Scheduled Entries ---
    const scheduledAlerts = scheduledEntries.map((entry): MaintenanceAlert => {
        const remainingKm = entry.odometerKm - currentOdometer;
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(`${entry.dateIso}T00:00:00`);
        const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: AlertStatus = 'OK';
        if (remainingKm < 0 || remainingDays < 0) {
            status = 'Overdue';
        } else if (remainingKm <= DUE_SOON_THRESHOLD || (remainingDays >= 0 && remainingDays <= 14)) {
            status = 'Due Soon';
        }

        return {
            name: entry.description,
            status,
            lastServiceKm: null, // Not applicable for scheduled, it's a future task
            dueKm: entry.odometerKm,
            remainingKm,
            dueDate: entry.dateIso,
            entry
        };
    });

    alerts.push(...scheduledAlerts);

    // --- Secondary source: Dynamically generate alerts based on user-defined intervals ---
    const fallbackChecks = Object.entries(intervals).map(([name, intervalKm]) => ({
      name,
      interval: intervalKm,
      keywords: getKeywordsForTask(name)
    }));

    fallbackChecks.forEach(check => {
      // Don't create fallback alert if a scheduled alert for the same task already exists
      const hasScheduledAlert = scheduledAlerts.some(alert => 
        check.keywords.some(kw => alert.name.toLowerCase().includes(kw))
      );
      if (hasScheduledAlert) return;

      const lastService = findLastService(loggedEntries, check.keywords);
      
      const lastServiceKm = lastService?.odometerKm ?? null;
      const dueKm = lastService ? lastService.odometerKm + check.interval : null;
      const remainingKm = dueKm ? dueKm - currentOdometer : null;

      let status: AlertStatus = 'OK';
      if (remainingKm !== null) {
          if (remainingKm < 0) {
              status = 'Overdue';
          } else if (remainingKm <= DUE_SOON_THRESHOLD) {
              status = 'Due Soon';
          }
      }

      // Only add alerts for items that are due or have history
      if (status !== 'OK' || lastServiceKm !== null) {
        alerts.push({
          name: check.name,
          status,
          lastServiceKm,
          dueKm,
          remainingKm
        });
      }
    });

    return alerts;

  }, [allEntries, currentOdometer, intervals, currentVehicle]);
};