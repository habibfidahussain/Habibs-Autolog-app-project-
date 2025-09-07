import React, { useState, useRef, useEffect } from 'react';
import type { ExchangeRates, BackupData } from '../types';
import { Currency } from '../types';
import { GoogleDriveSync } from './GoogleDriveSync';

interface AppSettingsModalProps {
  initialRates: ExchangeRates;
  onClose: () => void;
  onSaveRates: (newRates: Partial<ExchangeRates>) => void;
  onRestore: (data: BackupData) => void;
  onRestoreFromAutoBackup: () => void;
  getBackupData: () => BackupData;
  onResetApp: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ initialRates, onClose, onSaveRates, onRestore, onRestoreFromAutoBackup, getBackupData, onResetApp }) => {
  const [rates, setRates] = useState({
      [Currency.USD]: initialRates[Currency.USD] || 278,
      [Currency.EUR]: initialRates[Currency.EUR] || 300,
  });
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
        const backupJson = localStorage.getItem('autoLog_autoBackup');
        if (backupJson) {
            const backup = JSON.parse(backupJson);
            if (backup.timestamp) {
                setLastBackupTimestamp(backup.timestamp);
            }
        }
    } catch (e) {
        console.error('Could not read auto-backup timestamp', e);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRates(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRates(rates);
    onClose();
  };

  const handleBackup = () => {
    try {
        const data = getBackupData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `autolog-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(e) {
        alert(`Failed to create backup: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error('Failed to read file content.');
            }
            const parsedData = JSON.parse(result);
            onRestore(parsedData);
        } catch (err) {
            alert(`Error reading backup file: ${err instanceof Error ? err.message : 'Invalid file format.'}`);
        } finally {
            // Reset file input so the same file can be selected again
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.onerror = () => {
        alert('Error reading the selected file.');
    };
    reader.readAsText(file);
  };
  
  const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    try {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch {
        return 'Invalid date';
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">App Settings</h2>
        
        {/* Google Drive Sync Section */}
        <div className="space-y-4 border-b border-gray-700 pb-6 mb-6">
            <GoogleDriveSync getBackupData={getBackupData} onRestore={onRestore} />
        </div>

        {/* Currency Rates Section */}
        <form onSubmit={handleSubmit} className="space-y-4 border-b border-gray-700 pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-200">Currency Exchange Rates</h3>
          <p className="text-sm text-gray-400">Set the value of 1 USD and 1 EUR in your base currency (PKR).</p>
          <RateInput 
            label="1 USD to PKR"
            name={Currency.USD}
            value={rates[Currency.USD]}
            onChange={handleChange}
          />
          <RateInput 
            label="1 EUR to PKR"
            name={Currency.EUR}
            value={rates[Currency.EUR]}
            onChange={handleChange}
          />
           <div className="flex justify-end">
             <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors">Save Rates</button>
           </div>
        </form>

        {/* Data Management Section */}
        <div className="space-y-4 border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-200">Manual Data Management</h3>
            <p className="text-sm text-gray-400">Save your data to a file or restore it on a new device.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleBackup} 
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md font-semibold text-white transition-colors"
                >
                    Backup to File
                </button>
                <button 
                    onClick={handleRestoreClick}
                    className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 rounded-md font-semibold text-white transition-colors"
                >
                    Restore from File
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/json"
                    className="hidden"
                />
            </div>
        </div>
        
        {/* Automatic Backup Section */}
        <div className="space-y-4 border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-200">Automatic Backup</h3>
            <p className="text-sm text-gray-400">
                A local backup is automatically created whenever your data changes to protect against accidental loss.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm">
                    <span className="text-gray-300">Last saved: </span>
                    <span className="font-semibold text-white">{formatTimestamp(lastBackupTimestamp)}</span>
                </div>
                <button 
                    onClick={onRestoreFromAutoBackup}
                    className="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-semibold text-white transition-colors"
                >
                    Restore Backup
                </button>
            </div>
        </div>

        {/* Danger Zone Section */}
        <div className="space-y-3 border-t-2 border-red-500/30 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
            <p className="text-sm text-gray-400">
                Resetting the app will permanently delete all your data, including vehicles and maintenance history. This action cannot be undone.
            </p>
            <div className="text-right">
                <button 
                    onClick={onResetApp}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md font-semibold text-white transition-colors"
                >
                    Reset App Data
                </button>
            </div>
        </div>

        <div className="flex justify-end pt-8">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">Close</button>
        </div>
      </div>
      {/* Background click handler */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  );
};

interface RateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const RateInput: React.FC<RateInputProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input 
            type="number"
            step="0.01"
            {...props}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);