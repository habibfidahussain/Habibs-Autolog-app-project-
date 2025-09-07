import { useState, useEffect, useCallback } from 'react';

// Fix: Declare google and gapi as global variables to fix TypeScript errors.
// These are loaded from an external script and are not available at compile time.
declare const google: any;
declare const gapi: any;

// IMPORTANT: These credentials must be provided as environment variables.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const FOLDER_NAME = 'AutoLog Backups';

export interface DriveFile {
    id: string;
    name: string;
    createdTime: string;
}

export const useGoogleDrive = () => {
    const [isGapiReady, setIsGapiReady] = useState(false);
    // Fix: Use `any` for the token client since `google` is not typed.
    const [tokenClient, setTokenClient] = useState<any | null>(null);
    const [user, setUser] = useState<any>(null); // Simplified user profile
    const [error, setError] = useState<string | null>(null);

    // 1. Initialize GAPI and GIS clients
    useEffect(() => {
        if (!CLIENT_ID || !API_KEY || CLIENT_ID.startsWith('YOUR_')) {
            setError('Google Drive sync is not configured. The developer needs to provide API credentials.');
            setIsGapiReady(true); // Signal that loading is complete to show the error.
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            try {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    });

                    const client = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: '', // Handled by the promise flow
                    });
                    setTokenClient(client);
                    setIsGapiReady(true);
                });
            } catch (e) {
                setError('Failed to initialize Google libraries.');
                setIsGapiReady(true);
                console.error(e);
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await gapi.client.oauth2.userinfo.get();
            setUser(res.result);
        } catch (e) {
            console.error('Failed to fetch user profile', e);
            setUser(null);
        }
    }, []);

    // 2. Sign in flow
    const signIn = useCallback(() => {
        if (!tokenClient) {
            setError('Google client not ready.');
            return;
        }
        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                setError('Google Sign-In failed.');
                console.error(resp.error);
                return;
            }
            setError(null);
            await fetchUserProfile();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }, [tokenClient, fetchUserProfile]);

    // 3. Sign out flow
    const signOut = useCallback(() => {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token, () => {});
            gapi.client.setToken('');
            setUser(null);
        }
    }, []);

    const getAppFolderId = useCallback(async (): Promise<string> => {
        const response = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
            fields: 'files(id, name)',
        });
        
        if (response.result.files.length > 0) {
            return response.result.files[0].id!;
        } else {
            const fileMetadata = {
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const folderResponse = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id',
            });
            return folderResponse.result.id!;
        }
    }, []);
    
    const createBackup = useCallback(async (data: object) => {
        const folderId = await getAppFolderId();
        const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const fileName = `autolog_backup_${date}.json`;

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [folderId],
        };

        const fileContent = JSON.stringify(data, null, 2);
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
            body: form,
        });

        if (!response.ok) {
            throw new Error('Failed to upload backup file.');
        }
        return await response.json();
    }, [getAppFolderId]);
    
    const listBackups = useCallback(async (): Promise<DriveFile[]> => {
        const folderId = await getAppFolderId();
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, createdTime)',
            orderBy: 'createdTime desc',
        });
        return response.result.files as DriveFile[];
    }, [getAppFolderId]);
    
    const restoreBackup = useCallback(async (fileId: string): Promise<object> => {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return JSON.parse(response.body);
    }, []);


    return {
        isGapiReady,
        isSignedIn: !!user,
        user,
        error,
        signIn,
        signOut,
        createBackup,
        listBackups,
        restoreBackup,
    };
};