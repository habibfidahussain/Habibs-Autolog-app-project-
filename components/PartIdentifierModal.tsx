import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface PartIdentifierModalProps {
  onClose: () => void;
}

// Utility to convert a file to a base64 string
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export const PartIdentifierModal: React.FC<PartIdentifierModalProps> = ({ onClose }) => {
    const [image, setImage] = useState<{ src: string; mimeType: string; } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');
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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);


    const handleUseCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraActive(true);
                    setImage(null);
                    setAnalysisResult('');
                    setError('');
                }
            } catch (err) {
                setError('Could not access the camera. Please ensure you have given permission.');
                console.error(err);
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
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImage({ src: dataUrl, mimeType: 'image/jpeg' });
            stopCamera();
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setImage({ src: URL.createObjectURL(file), mimeType: file.type });
                setAnalysisResult('');
                setError('');
            } catch (err) {
                setError('Could not process the selected file.');
            }
        }
    };

    const handleIdentify = async () => {
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
        setAnalysisResult('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Fetch the image data and convert to base64
            const response = await fetch(image.src);
            const blob = await response.blob();
            const base64Data = await toBase64(new File([blob], "capture.jpg", { type: image.mimeType }));

            const imagePart = {
              inlineData: {
                mimeType: image.mimeType,
                data: base64Data,
              },
            };
            
            const textPart = {
                text: "Please identify the motorcycle part in this image. Describe what it is, its function, and common signs of wear or failure. If it's not a motorcycle part, say so."
            };

            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [imagePart, textPart] },
            });
            
            setAnalysisResult(result.text);

        } catch (err) {
            console.error('Gemini API error:', err);
            setError(`An error occurred during analysis. ${err instanceof Error ? err.message : 'Please try again.'}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetState = () => {
        setImage(null);
        setAnalysisResult('');
        setError('');
        stopCamera();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">AI Part Identifier</h2>
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
                                <span className="font-semibold text-gray-200">How to get the best results</span>
                            </div>
                            <ChevronDownIcon className={`transform transition-transform ${isHelpVisible ? 'rotate-180' : ''}`} />
                        </button>
                        {isHelpVisible && (
                            <div className="px-3 pb-3 text-sm text-gray-300 space-y-2">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use a clear, well-lit photo. Avoid blurry images.</li>
                                    <li>Focus on a single part.</li>
                                    <li>Avoid cluttered backgrounds for better accuracy.</li>
                                    <li>Try to include any identifying marks or numbers on the part.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    {!image && !isCameraActive && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
                            <CameraIcon />
                            <p className="mt-2 text-gray-400">Capture or upload a photo of a part to identify it.</p>
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
                            <img src={image.src} alt="Part preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-900" />
                             <div className="flex gap-4">
                                 <button onClick={resetState} className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Retake / New</button>
                                 <button onClick={handleIdentify} disabled={isLoading} className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white disabled:bg-gray-500">
                                     {isLoading ? 'Analyzing...' : 'Identify Part'}
                                 </button>
                             </div>
                         </div>
                    )}
                    
                    {isLoading && (
                        <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
                            <p className="mt-2 text-gray-400">Gemini is analyzing the image...</p>
                        </div>
                    )}

                    {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-md text-sm">{error}</div>}

                    {analysisResult && (
                        <div className="p-4 bg-gray-700/50 rounded-lg max-h-60 overflow-y-auto">
                            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Analysis Result</h3>
                            <p className="text-gray-200 whitespace-pre-wrap">{analysisResult}</p>
                        </div>
                    )}
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

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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