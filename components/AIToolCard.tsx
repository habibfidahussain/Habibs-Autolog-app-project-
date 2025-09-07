import React from 'react';

interface AIToolCardProps {
    onIdentifyPartClick: () => void;
    onScanRefuelClick: () => void;
}

export const AIToolCard: React.FC<AIToolCardProps> = ({ onIdentifyPartClick, onScanRefuelClick }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
                 <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <SparklesIcon />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">AI Assistant</h3>
                    <p className="text-sm text-gray-400">Use your camera to work faster.</p>
                </div>
            </div>

            <div className="space-y-4">
                <Tool
                    icon={<CameraIcon />}
                    title="Identify a Part"
                    description="Not sure what a part is? Snap a photo to learn its name, function, and signs of wear."
                    onClick={onIdentifyPartClick}
                    buttonText="Identify Part"
                />
                <Tool
                    icon={<FuelPumpIcon />}
                    title="Scan for Refuel"
                    description="Log fuel faster. Scan the fuel pump to automatically fill in the cost and liters."
                    onClick={onScanRefuelClick}
                    buttonText="Scan for Refuel"
                />
            </div>
        </div>
    );
}

interface ToolProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    buttonText: string;
}

const Tool: React.FC<ToolProps> = ({ icon, title, description, onClick, buttonText }) => {
    return (
        <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 text-indigo-400 flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-grow">
                <h4 className="font-semibold text-gray-100">{title}</h4>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
            <button
                onClick={onClick}
                className="w-full sm:w-auto flex-shrink-0 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors duration-300 text-sm"
            >
                {buttonText}
            </button>
        </div>
    );
};

// --- Icon Components ---

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 6.343l-2.828 2.828M12 21v-4m-2-2h4m5.657-2.828l-2.828-2.828M18 5h4m-2 2v-4m-2.828 11.657l2.828 2.828M3 15a4 4 0 004 4h4a4 4 0 004-4v-4a4 4 0 00-4-4H7a4 4 0 00-4 4v4z" />
    </svg>
);

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const FuelPumpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5h.375v-.375c0-1.036.84-1.875 1.875-1.875h3.75c1.036 0 1.875.84 1.875 1.875v.375h.375m-6.75 0h6.75M8.25 7.5v9l-1.125-1.125a1.125 1.125 0 010-1.586l1.125-1.125H3.75m12.75.375l-1.125 1.125a1.125 1.125 0 01-1.586 0l-1.125-1.125H20.25m-6.75-9v9" />
    </svg>
);