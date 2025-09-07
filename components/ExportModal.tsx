import React, { useState } from 'react';
import type { ExportOptions } from '../types';

interface ExportModalProps {
  onClose: () => void;
  onConfirm: (options: ExportOptions) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onConfirm }) => {
    const [options, setOptions] = useState<ExportOptions>({
        maintenance: true,
        fuel: true,
    });

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setOptions(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = () => {
        if (!options.maintenance && !options.fuel) {
            alert('Please select at least one data type to export.');
            return;
        }
        onConfirm(options);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-white">Export Data</h2>
                <div className="space-y-4">
                    <p className="text-gray-300">Select the data you want to export to CSV files.</p>
                    <Checkbox
                        label="Maintenance Log (Oil, Parts, Labour, etc.)"
                        name="maintenance"
                        checked={options.maintenance}
                        onChange={handleCheckboxChange}
                    />
                    <Checkbox
                        label="Fuel Log (All fuel entries)"
                        name="fuel"
                        checked={options.fuel}
                        onChange={handleCheckboxChange}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-8">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors">Export</button>
                </div>
            </div>
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};

interface CheckboxProps {
    label: string;
    name: keyof ExportOptions;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, name, checked, onChange }) => (
    <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer">
        <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-gray-200">{label}</span>
    </label>
);
