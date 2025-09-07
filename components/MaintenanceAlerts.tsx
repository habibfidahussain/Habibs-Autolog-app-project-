import React from 'react';
import type { MaintenanceAlert, AlertStatus } from '../types';
import { formatIsoDate } from '../utils/dateUtils';

interface MaintenanceAlertsProps {
  alerts: MaintenanceAlert[];
  odometerCheckValue: number | null;
  latestLoggedOdometer: number;
  onOdometerUpdate: (km: number | null) => void;
  onScanOdometerClick: () => void;
}

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ScanIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);


const statusStyles: Record<AlertStatus, { icon: JSX.Element; color: string; bgColor: string; }> = {
  Overdue: {
    icon: <ErrorIcon />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
  },
  'Due Soon': {
    icon: <WarningIcon />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
  },
  OK: {
    icon: <CheckCircleIcon />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
};

export const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({ alerts, odometerCheckValue, latestLoggedOdometer, onOdometerUpdate, onScanOdometerClick }) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const statusOrder: Record<AlertStatus, number> = { Overdue: 1, 'Due Soon': 2, OK: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const hasHistory = latestLoggedOdometer > 0;
  const isCheckingFuture = odometerCheckValue !== null;
  const currentOdometer = odometerCheckValue ?? latestLoggedOdometer;

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white">Maintenance Status</h3>
        <p className="text-gray-400 text-sm mt-1">Check current or future maintenance needs.</p>
      </div>

      <div className="relative">
        <input
          type="number"
          placeholder={hasHistory ? `Current: ${latestLoggedOdometer} KM. Check a future value...` : "Enter a kilometer value to check..."}
          value={odometerCheckValue ?? ''}
          onChange={(e) => onOdometerUpdate(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 pr-16 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          aria-label="Odometer check value"
        />
        <button 
            onClick={onScanOdometerClick}
            className="absolute inset-y-0 right-0 flex items-center gap-2 pl-3 pr-4 text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors"
            aria-label="Scan Odometer"
        >
            <ScanIcon />
            Scan
        </button>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="font-semibold text-gray-300 mb-3">
            Status at {currentOdometer.toLocaleString()} KM
        </h4>
        {sortedAlerts.length > 0 ? (
          <div className="space-y-3">
            {sortedAlerts.map((alert, index) => (
              <AlertItem key={index} alert={alert} />
            ))}
          </div>
        ) : (
            <div className="text-center py-8 px-4 bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 mx-auto text-green-400"><CheckCircleIcon /></div>
                <p className="mt-2 font-semibold text-green-400">
                    {hasHistory || isCheckingFuture ? "All systems are go!" : "No maintenance history found."}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    {hasHistory || isCheckingFuture ? "No immediate maintenance is due at this odometer." : "Enter a kilometer value above to see projected needs."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: MaintenanceAlert;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const style = statusStyles[alert.status];
  const isScheduled = !!alert.entry;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${style.bgColor}`}>
      <div className={`flex-shrink-0 mt-0.5 ${style.color}`}>{style.icon}</div>
      <div className="flex-grow">
        <p className="font-semibold text-white">{alert.name}</p>
        <div className="text-sm text-gray-300 mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {alert.remainingKm !== null && (
                 <span className={`${alert.remainingKm < 0 ? 'text-red-400' : (alert.remainingKm <= 500 ? 'text-yellow-400' : 'text-gray-400')}`}>
                    {alert.remainingKm < 0 
                        ? `${Math.abs(alert.remainingKm).toLocaleString()} km overdue` 
                        : `${alert.remainingKm.toLocaleString()} km remaining`
                    }
                 </span>
            )}
            {isScheduled && alert.dueDate && (
                 <span className="text-gray-400">
                    Due by: {formatIsoDate(alert.dueDate)}
                 </span>
            )}
             {alert.dueKm !== null && (
                 <span className="text-gray-400">
                    Due at: {alert.dueKm.toLocaleString()} km
                 </span>
            )}
            {alert.lastServiceKm !== null && (
                 <span className="text-gray-400">
                    Last at: {alert.lastServiceKm.toLocaleString()} km
                 </span>
            )}
        </div>
      </div>
      <div className={`flex-shrink-0 px-3 py-1 text-xs font-bold rounded-full ${style.bgColor} ${style.color}`}>
        {alert.status.toUpperCase()}
      </div>
    </div>
  );
};