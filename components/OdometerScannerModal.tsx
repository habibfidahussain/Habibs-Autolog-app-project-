import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface OdometerScannerModalProps {
  onClose: () => void;
  onOdometerScanned: (odometer: number) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export const OdometerScannerModal: React.FC<OdometerScannerModalProps> = ({ onClose, onOdometerScanned }) => {
    const [image, setImage] = useState<{ src: string; mimeType: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [isCameraActive, setIsCameraActive] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);


    const handleUseCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraActive(true);
                    setImage(null);
                    setError('');
                }
            } catch (err) {
                setError('Could not access the camera. Please ensure you have given permission.');
            }
        } else {
            setError('Camera access is not supported by your browser.');
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImage({ src: dataUrl, mimeType: 'image/jpeg' });
            stopCamera();
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage({ src: URL.createObjectURL(file), mimeType: file.type });
            setError('');
        }
    };

    const handleScan = async () => {
        if (!image) {
            setError('Please capture or upload an image first.');
            return;
        }
        
        if (!process.env.API_KEY) {
            setError('API key is not configured. This feature is unavailable.');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await fetch(image.src);
            const blob = await response.blob();
            const base64Data = await toBase64(new File([blob], "capture.jpg", { type: image.mimeType }));

            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { 
                  parts: [
                      { inlineData: { mimeType: image.mimeType, data: base64Data } },
                      { text: "Analyze this image of a vehicle's odometer. Your single task is to extract the main numerical mileage reading. Ignore any trip meters or other numbers. Respond with ONLY the digits of the odometer reading. For example, if the odometer shows '12345.6 km', your response should be '12345'." }
                  ] 
              },
            });
            
            const text = result.text.trim().replace(/\D/g, ''); // Remove non-digit characters
            const odometer = parseInt(text, 10);

            if (isNaN(odometer)) {
                throw new Error("Could not read a valid number from the image.");
            }
            
            onOdometerScanned(odometer);

        } catch (err) {
            console.error('Gemini API error:', err);
            setError(`Failed to read odometer. ${err instanceof Error ? err.message : 'Please try again with a clearer image.'}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetState = () => {
        setImage(null);
        setError('');
        stopCamera();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Scan Odometer</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-600" aria-label="Close">
                        <CloseIcon />
                    </button>
                </div>

                <div className="space-y-4">
                    {!image && !isCameraActive && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
                            <p className="mt-2 text-gray-400">Capture or upload a clear photo of your odometer.</p>
                            <div className="mt-6 flex justify-center gap-4">
                                <button onClick={handleUseCamera} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white">Use Camera</button>
                                <button onClick={() => fileInputRef.current?.click()} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Upload Image</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                    )}

                    {isCameraActive && (
                        <div className="space-y-4">
                            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-gray-900"></video>
                            <button onClick={handleCapture} className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md font-semibold text-white">Take Picture</button>
                        </div>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {image && (
                         <div className="space-y-4">
                            <img src={image.src} alt="Odometer preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-900" />
                             <div className="flex gap-4">
                                 <button onClick={resetState} className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Retake / New</button>
                                 <button onClick={handleScan} disabled={isLoading} className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white disabled:bg-gray-500">
                                     {isLoading ? 'Scanning...' : 'Confirm Scan'}
                                 </button>
                             </div>
                         </div>
                    )}
                    
                    {isLoading && (
                        <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
                            <p className="mt-2 text-gray-400">Reading odometer...</p>
                        </div>
                    )}

                    {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-md text-sm">{error}</div>}
                </div>
            </div>
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);