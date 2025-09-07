import { Modality } from "@google/genai";

export enum Category {
  Oil = 'Oil',
  Parts = 'Parts',
  Labour = 'Labour',
  Fuel = 'Fuel',
  Other = 'Other',
}

export enum Currency {
    PKR = 'PKR',
    USD = 'USD',
    EUR = 'EUR',
}

export type ExchangeRates = {
    [key in Currency]: number;
};

/**
 * A flexible record to store user-defined service intervals.
 * Keys are the names of the maintenance tasks (e.g., "Oil Change")
 * and values are the interval in kilometers.
 */
export type ServiceIntervals = Record<string, number>;

export interface Vehicle {
  id: number;
  name: string;
  year?: number;
  engineCc?: number;
  intervals?: ServiceIntervals;
}

export interface MaintenanceEntry {
  id: number;
  vehicleId: number;
  dateIso: string; // YYYY-MM-DD
  odometerKm: number;
  categories: Category[];
  description: string;
  cost: number;
  liters?: number;
  pricePerLiter?: number;

  // Recurring Task Fields
  status: 'logged' | 'scheduled';
  isRecurring?: boolean;
  recurrenceIntervalDays?: number;
  recurrenceIntervalKm?: number;
  parentId?: number; // Links a scheduled entry to the logged one that created it
}

export type AlertStatus = 'Overdue' | 'Due Soon' | 'OK';

export interface MaintenanceAlert {
  name: string;
  status: AlertStatus;
  lastServiceKm: number | null;
  dueKm: number | null;
  remainingKm: number | null;
  dueDate?: string;
  entry?: MaintenanceEntry;
}

export interface BackupData {
    vehicles: Vehicle[];
    entries: MaintenanceEntry[];
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export interface ExportOptions {
    maintenance: boolean;
    fuel: boolean;
}

export type DateRangePreset = 'all' | 'last_30_days' | 'last_90_days' | 'last_year';

export interface OdometerRange {
  min: string;
  max: string;
}