import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

interface RefuelScannerModalProps {
  onClose: () => void;
  onRefuelDataScanned: (data: { cost: number | null; liters: number | null; pricePerLiter: number | null }) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export const RefuelScannerModal: React.FC<RefuelScannerModalProps> = ({ onClose, onRefuelDataScanned }) => {
    const [image, setImage] = useState<{ src: string; mimeType: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);

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
            
            const prompt = `You are an expert at reading fuel pump displays. Analyze the provided image and extract:
- Total Cost: Look for keywords like 'Amount', 'Total', 'Sale', 'Rs', '$'. This is often the largest numerical value.
- Liters: Look for keywords like 'Liters', 'Ltr', 'Volume', 'Fuel'.
- Price per Liter: Look for 'Price/L', 'Rate', '$/L'.
Respond ONLY with the JSON object in the specified format. If a value cannot be determined, return null for it.`;


            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { 
                  parts: [
                      { inlineData: { mimeType: image.mimeType, data: base64Data } },
                      { text: prompt }
                  ] 
              },
              config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalCost: { type: Type.NUMBER, description: "The total purchase price, identified by keywords like 'Total' or 'Amount'." },
                        totalLiters: { type: Type.NUMBER, description: "The total volume of fuel in liters, identified by keywords like 'Liters' or 'Volume'." },
                        pricePerLiter: { type: Type.NUMBER, description: "The price for a single liter of fuel, identified by keywords like 'Price/L'." }
                    },
                  },
              }
            });
            
            const parsed = JSON.parse(result.text);
            
            if (!parsed.totalCost && !parsed.totalLiters && !parsed.pricePerLiter) {
                 throw new Error("Could not read any data from the image.");
            }
            
            onRefuelDataScanned({ 
                cost: parsed.totalCost, 
                liters: parsed.totalLiters,
                pricePerLiter: parsed.pricePerLiter
            });

        } catch (err) {
            console.error('Gemini API error:', err);
            setError(`Failed to read data. ${err instanceof Error ? err.message : 'Please try again with a clearer image.'}`);
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
                    <h2 className="text-2xl font-bold text-white">Scan for Refuel</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-600" aria-label="Close">
                        <CloseIcon />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg">
                        <button
                            onClick={() => setIsHelpVisible(!isHelpVisible)}
                            className="w-full flex justify-between items-center p-3 text-left"
                            aria-expanded={isHelpVisible}
                        >
                            <div className="flex items-center gap-2">
                                <InfoIcon />
                                <span className="font-semibold text-gray-200">How to get a good scan</span>
                            </div>
                            <ChevronDownIcon className={`transform transition-transform ${isHelpVisible ? 'rotate-180' : ''}`} />
                        </button>
                        {isHelpVisible && (
                            <div className="px-3 pb-3 text-sm text-gray-300 space-y-2">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Capture the entire pump screen showing the final numbers.</li>
                                    <li>Make sure the numbers for <strong>Cost</strong>, <strong>Liters</strong>, and <strong>Price/Liter</strong> are in focus.</li>
                                    <li>Try to avoid screen glare and reflections.</li>
                                    <li>A straight-on photo works best.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    {!image && !isCameraActive && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
                             <p className="text-gray-300">Use your camera to scan the fuel pump display.</p>
                            <p className="mt-1 text-gray-400">The AI will extract the cost and liters for you.</p>
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
                            <img src={image.src} alt="Fuel pump preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-900" />
                             <div className="flex gap-4">
                                 <button onClick={resetState} className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Retake / New</button>
                                 <button onClick={handleScan} disabled={isLoading} className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white disabled:bg-gray-500">
                                     {isLoading ? 'Scanning...' : 'Extract Refuel Data'}
                                 </button>
                             </div>
                         </div>
                    )}
                    
                    {isLoading && (
                        <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
                            <p className="mt-2 text-gray-400">Analyzing fuel data...</p>
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

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);