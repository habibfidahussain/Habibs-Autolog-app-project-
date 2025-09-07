import type { ServiceIntervals } from './types';

// Vehicle-specific service intervals presets
export const SERVICE_INTERVALS: Record<string, ServiceIntervals> = {
  'DEFAULT': {
    'Oil Change': 8000,
    'Oil Filter Change': 8000,
    'Engine Air Filter Change': 25000,
    'General Tuning': 25000,
    'Tire Rotation': 10000,
    'Brake Fluid Change': 50000,
    'Coolant Change': 100000,
    'Transmission Fluid Change': 80000,
    'Spark Plugs Replacement': 100000,
    'Cabin Air Filter Change': 25000,
  },
  'Suzuki GD 110s': {
    'Oil Change': 1500,
    'Oil Filter Change': 4000,
    'Engine Air Filter Change': 2500,
    'General Tuning': 5000,
    'Brake Fluid Change': 30000,
    'Spark Plugs Replacement': 8000,
  },
  'Honda CG-125': {
    'Oil Change': 1300,
    'Oil Filter Change': 4000,
    'Engine Air Filter Change': 4000,
    'General Tuning': 4000,
    'Brake Fluid Change': 30000,
    'Spark Plugs Replacement': 8000,
  },
  'Toyota Corolla': {
    'Oil Change': 10000,
    'Oil Filter Change': 10000,
    'Engine Air Filter Change': 30000,
    'General Tuning': 100000,
    'Tire Rotation': 8000,
    'Brake Fluid Change': 50000,
    'Coolant Change': 160000,
    'Transmission Fluid Change': 100000,
    'Spark Plugs Replacement': 160000,
    'Cabin Air Filter Change': 25000,
  },
};

export const DUE_SOON_THRESHOLD = 500; // km