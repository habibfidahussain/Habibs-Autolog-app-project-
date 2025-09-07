import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { Vehicle, ServiceIntervals } from '../types';
import { SERVICE_INTERVALS } from '../constants';

interface VehicleSettingsModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (intervals: ServiceIntervals) => void;
}

interface AISuggestion {
    taskName: string;
    intervalKm: number;
    reason: string;
}

interface EditableInterval {
    id: string;
    name: string;
    value: number;
}

export const VehicleSettingsModal: React.FC<VehicleSettingsModalProps> = ({ vehicle, onClose, onSave }) => {
  const [editableIntervals, setEditableIntervals] = useState<EditableInterval[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getInitialIntervals = (): ServiceIntervals => {
      const preset = SERVICE_INTERVALS[vehicle.name] || SERVICE_INTERVALS['DEFAULT'];
      return { ...preset, ...(vehicle.intervals || {}) };
    };
    const initialIntervals = getInitialIntervals();
    setEditableIntervals(
        Object.entries(initialIntervals).map(([name, value], index) => ({
            id: `${name}-${index}-${Date.now()}`,
            name,
            value,
        }))
    );
  }, [vehicle]);

  const handleIntervalChange = (index: number, field: 'name' | 'value', newValue: string) => {
    const newIntervals = [...editableIntervals];
    if (field === 'name') {
        newIntervals[index].name = newValue;
    } else {
        const numValue = parseInt(newValue, 10);
        newIntervals[index].value = isNaN(numValue) ? 0 : numValue;
    }
    setEditableIntervals(newIntervals);
  };
  
  const handleRemoveInterval = (indexToRemove: number) => {
    setEditableIntervals(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAddInterval = (name: string, value: number) => {
    if (name.trim() === '') return;
    setEditableIntervals(prev => [
        ...prev,
        { id: Date.now().toString(), name: name.trim(), value }
    ]);
  };

  const handleGetAiSuggestions = async () => {
    if (!process.env.API_KEY) {
      setError("AI features are not configured. API_KEY is missing.");
      return;
    }
    setIsLoading(true);
    setError('');
    setAiSuggestions(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Based on the following vehicle, suggest a typical maintenance schedule with intervals in kilometers. 
      Vehicle: ${vehicle.name} ${vehicle.year || ''} ${vehicle.engineCc ? `${vehicle.engineCc}cc` : ''}.
      
      Provide a JSON response with an array of objects. Each object should have:
      1. "taskName" (e.g., "Engine Oil Change")
      2. "intervalKm" (e.g., 2000)
      3. "reason" (e.g., "For small single-cylinder engines.")
      
      IMPORTANT: Include only items relevant to this type of vehicle. For example, do not suggest 'Coolant Change' for an air-cooled engine or 'Tire Rotation' for a typical motorcycle. Provide 5-7 key suggestions.`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskName: { type: Type.STRING },
                intervalKm: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ["taskName", "intervalKm", "reason"]
            }
          }
        },
      });
      
      const parsed = JSON.parse(result.text);
      setAiSuggestions(parsed);

    } catch (err) {
      console.error("AI Suggestions Error:", err);
      setError(`An error occurred. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate names, as they would overwrite each other in the final object
    const names = editableIntervals.map(i => i.name.trim().toLowerCase()).filter(Boolean);
    const hasDuplicates = names.some((name, index) => names.indexOf(name) !== index);
    if (hasDuplicates) {
        setError("Duplicate task names are not allowed. Please rename or remove one.");
        return;
    }
    setError('');
    
    const newIntervals: ServiceIntervals = editableIntervals.reduce((acc, curr) => {
        if (curr.name.trim()) {
            acc[curr.name.trim()] = curr.value;
        }
        return acc;
    }, {} as ServiceIntervals);
    
    onSave(newIntervals);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-1 text-white">Interval Settings</h2>
        <p className="text-gray-400 mb-6">For {vehicle.name}</p>
        
        <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg mb-6 text-center">
            <h3 className="font-semibold text-indigo-300">Not sure where to start?</h3>
            <p className="text-sm text-gray-400 mt-1 mb-3">Let AI suggest a maintenance schedule for your specific vehicle.</p>
            <button
                type="button"
                onClick={handleGetAiSuggestions}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto mx-auto py-2 px-5 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors disabled:bg-gray-500"
            >
                {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
                {isLoading ? 'Thinking...' : 'Get AI Suggestions'}
            </button>
        </div>
        
        {error && <p className="text-sm text-center text-red-400 mb-4">{error}</p>}
        
        {aiSuggestions && (
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">AI Suggestions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {aiSuggestions.map((s, i) => (
                        <div key={i} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center gap-2">
                            <div>
                                <p className="font-semibold text-gray-100">{s.taskName}</p>
                                <p className="text-xs text-gray-400">{s.reason} (suggested: {s.intervalKm.toLocaleString()} km)</p>
                            </div>
                            <button
                                onClick={() => handleAddInterval(s.taskName, s.intervalKm)}
                                className="py-1 px-3 text-sm bg-green-600 hover:bg-green-700 rounded-md font-semibold text-white flex-shrink-0"
                            >
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Your Tracked Intervals</h3>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-3">
              {editableIntervals.length > 0 ? (
                editableIntervals.map((interval, index) => (
                    <div key={interval.id} className="flex items-end gap-2 p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex-grow">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Task Name</label>
                            <input 
                                type="text"
                                value={interval.name}
                                onChange={(e) => handleIntervalChange(index, 'name', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Oil Change"
                            />
                        </div>
                        <div className="w-32 flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Interval (km)</label>
                            <input 
                                type="number"
                                value={interval.value}
                                onChange={(e) => handleIntervalChange(index, 'value', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., 3000"
                            />
                        </div>
                        <button type="button" onClick={() => handleRemoveInterval(index)} className="p-2 h-10 rounded-md hover:bg-red-500/20 text-red-400 flex-shrink-0" aria-label="Remove interval">
                            <DeleteIcon />
                        </button>
                    </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No intervals are being tracked. Use the AI suggestions or add a custom interval.</p>
              )}
          </div>
          <AddCustomInterval onAdd={handleAddInterval} />
          
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 mt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md font-semibold text-white transition-colors">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AddCustomInterval: React.FC<{ onAdd: (name: string, value: number) => void }> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        const numValue = parseInt(value, 10);
        if (name && !isNaN(numValue)) {
            onAdd(name, numValue);
            setName('');
            setValue('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <div className="pt-4">
                <button type="button" onClick={() => setIsAdding(true)} className="w-full text-center py-2 px-4 border-2 border-dashed border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-indigo-300 rounded-md font-semibold transition-colors">
                    + Add Custom Interval
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-700/50 rounded-lg mt-4 space-y-3">
            <h4 className="font-semibold text-gray-300">New Custom Interval</h4>
            <input 
                type="text"
                placeholder="Task Name (e.g., Polish Chrome)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2"
            />
            <input 
                type="number"
                placeholder="Interval in KM (e.g., 5000)"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAdding(false)} className="py-1 px-3 text-sm bg-gray-600 hover:bg-gray-700 rounded-md">Cancel</button>
                <button type="button" onClick={handleAdd} className="py-1 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-md">Add</button>
            </div>
        </div>
    );
};


const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 10a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zM15 10a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);