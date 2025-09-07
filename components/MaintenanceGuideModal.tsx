import React from 'react';
import type { Vehicle } from '../types';
import { maintenanceSchedules } from '../utils/maintenanceSchedules';

interface MaintenanceGuideModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export const MaintenanceGuideModal: React.FC<MaintenanceGuideModalProps> = ({ vehicle, onClose }) => {
    const schedule = maintenanceSchedules[vehicle.name] || maintenanceSchedules['DEFAULT'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Maintenance Guide</h2>
                        <p className="text-gray-400">For {vehicle.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-600" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {schedule.map((interval, index) => (
                        <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-bold text-indigo-300">{interval.title}</h3>
                            <p className="text-sm text-gray-400 mb-3">{interval.subtitle}</p>
                            <ul className="space-y-2">
                                {interval.tasks.map((task, taskIndex) => (
                                    <li key={taskIndex} className="flex items-start gap-3 text-sm">
                                        <div className="flex-shrink-0 pt-1 text-indigo-400"><CheckCircleIcon /></div>
                                        <div>
                                            <span className="font-semibold text-gray-200">{task.item}: </span>
                                            <span className="text-gray-300">{task.action}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="text-xs text-gray-500 text-center pt-4">
                        <p>Disclaimer: This is a general maintenance guide based on typical usage.</p>
                        <p>Always consult your vehicle's official owner's manual for the most accurate and complete information.</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-700/50 text-right">
                    <button onClick={onClose} className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors">
                        Close
                    </button>
                </div>
            </div>
            {/* Background click handler */}
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
