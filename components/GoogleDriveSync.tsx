import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleDrive, type DriveFile } from '../hooks/useGoogleDrive';
import type { BackupData } from '../types';

interface GoogleDriveSyncProps {
  getBackupData: () => BackupData;
  onRestore: (data: BackupData) => void;
}

type SyncStatus = 'idle' | 'signing-in' | 'backing-up' | 'listing' | 'restoring';

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ getBackupData, onRestore }) => {
    const { isGapiReady, isSignedIn, user, error, signIn, signOut, createBackup, listBackups, restoreBackup } = useGoogleDrive();
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [backups, setBackups] = useState<DriveFile[]>([]);
    const [showBackups, setShowBackups] = useState(false);

    useEffect(() => {
        if (isSignedIn) {
            setStatus('listing');
            listBackups()
                .then(files => {
                    setBackups(files);
                })
                .catch(err => alert(`Error fetching backups: ${err.message}`))
                .finally(() => setStatus('idle'));
        } else {
            setBackups([]);
            setShowBackups(false);
        }
    }, [isSignedIn, listBackups]);

    const handleBackup = useCallback(async () => {
        setStatus('backing-up');
        try {
            const data = getBackupData();
            await createBackup(data);
            alert('Backup created successfully!');
            const files = await listBackups();
            setBackups(files);
        } catch (err) {
            alert(`Backup failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setStatus('idle');
        }
    }, [getBackupData, createBackup, listBackups]);

    const handleRestore = useCallback(async (fileId: string) => {
        if (!window.confirm('Are you sure you want to restore this backup? It will overwrite your current data.')) {
            return;
        }
        setStatus('restoring');
        try {
            const data = await restoreBackup(fileId) as BackupData;
            onRestore(data);
        } catch (err) {
            alert(`Restore failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setStatus('idle');
        }
    }, [restoreBackup, onRestore]);
    
    const isBusy = status !== 'idle';

    const renderContent = () => {
        if (!isGapiReady) {
            return <p className="text-sm text-gray-400 text-center py-4">Initializing Google Sync...</p>;
        }

        if (error) {
            return (
                <div className="mt-2">
                    <p className="text-sm text-gray-400">Sign in to back up your data to Google Drive.</p>
                    <button disabled className="mt-4 w-full flex items-center justify-center gap-3 py-2 px-4 bg-gray-600 rounded-md font-semibold text-gray-400 cursor-not-allowed">
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                    <div className="mt-3 bg-yellow-900/30 border border-yellow-500/30 p-3 rounded-md text-sm text-yellow-300">
                         <p><strong className="font-semibold">Feature Unavailable:</strong> {error}</p>
                    </div>
                </div>
            );
        }

        if (isSignedIn) {
            return (
                 <div className="space-y-4 mt-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <p className="text-gray-300">Signed in as</p>
                            <p className="font-semibold text-white">{user?.name} ({user?.email})</p>
                        </div>
                        <button onClick={signOut} className="py-2 px-4 text-sm bg-gray-600 hover:bg-gray-700 rounded-md">Sign Out</button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleBackup} disabled={isBusy} className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md disabled:bg-gray-500">
                            {status === 'backing-up' ? 'Backing up...' : 'Backup to Drive'}
                        </button>
                        <button onClick={() => setShowBackups(!showBackups)} disabled={isBusy || backups.length === 0} className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                           {showBackups ? 'Hide Backups' : `Restore from Drive (${backups.length})`}
                        </button>
                    </div>

                    {showBackups && (
                        <div className="pt-4 border-t border-gray-700">
                            <h4 className="font-semibold text-gray-300 mb-2">Available Backups</h4>
                            {status === 'listing' && <p className="text-sm text-gray-400">Loading...</p>}
                            {backups.length === 0 && status === 'idle' && (
                                <p className="text-sm text-gray-400">No backups found. Create one first!</p>
                            )}
                            {backups.length > 0 && (
                                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {backups.map(file => (
                                        <li key={file.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-gray-200">{file.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(file.createdTime).toLocaleString()}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleRestore(file.id)} 
                                                disabled={isBusy}
                                                className="py-1 px-3 text-sm bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                                            >
                                                {status === 'restoring' ? '...' : 'Restore'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Signed out state
        return (
             <>
                <p className="text-sm text-gray-400">Sign in to back up your data to Google Drive.</p>
                <div className="mt-4">
                    <button onClick={signIn} disabled={isBusy} className="w-full flex items-center justify-center gap-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors disabled:bg-gray-500">
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                </div>
            </>
        );
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-200">Google Drive Sync</h3>
            {renderContent()}
        </div>
    );
};

const GoogleIcon: React.FC = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M44.5 20H24v8h11.3c-1.6 5.2-6.4 9-11.3 9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l6-6C34.4 3.7 29.5 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
        <path d="M44.5 20H24v8h11.3c-1.6 5.2-6.4 9-11.3 9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l6-6C34.4 3.7 29.5 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="url(#paint0_linear_14_11)"/>
        <path d="M2 23c0 12.2 9.8 22 22 22 5.4 0 10.5-2 14.4-5.3l-6.8-6.8c-2.4 1.7-5.5 2.7-8.6 2.7-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l6-6C34.4 3.7 29.5 1 24 1 11.8 1 2 10.8 2 23z" fill="#4CAF50"/>
        <path d="M46.5 24c0-1.5-.2-3-.5-4.5H24v8h13.3c-1 3.5-4 6.5-7.3 6.5-4.4 0-8-3.6-8-8s3.6-8 8-8c2.4 0 4.5 1 6 2.7l5-5C35 4.7 30 2 24 2 13 2 4 11 4 23s9 21 21 21c11 0 20-8 20-20z" fill="#1976D2"/>
        <path d="M24 44c5.5 0 10.5-2 14.4-5.3l-6.8-6.8c-2.4 1.7-5.5 2.7-8.6 2.7-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l6-6C34.4 3.7 29.5 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22z" fill="#FFC107"/>
        <defs><linearGradient id="paint0_linear_14_11" x1="2" y1="23" x2="46" y2="23" gradientUnits="userSpaceOnUse"><stop stopColor="#2196F3"/><stop offset="1" stopColor="#4CAF50"/></linearGradient></defs>
    </svg>
);