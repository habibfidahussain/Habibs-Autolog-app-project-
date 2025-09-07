import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MaintenanceEntry } from '../types';
import { Category } from '../types';
import { getTodayIsoDate } from '../utils/dateUtils';
import { DatePicker } from './DatePicker';

interface ParsedEntry {
    description: string;
    category: Category;
    cost: number;
}

interface AddEntryModalProps {
  entry: MaintenanceEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<MaintenanceEntry, 'id' | 'vehicleId'>) => void;
  onSaveMultiple: (entries: Omit<MaintenanceEntry, 'id' | 'vehicleId'>[]) => void;
  initialData?: { cost: number | null; liters: number | null; pricePerLiter: number | null; } | null;
  initialCategory?: Category | null;
  onInitiateRefuelScan: () => void;
  scannedOdometer: number | null;
  onInitiateOdometerScan: () => void;
  onOdometerScanConsumed: () => void;
}

type LastEditedFuelField = 'cost' | 'liters' | 'price';

const allCategories = Object.values(Category);

export const AddEntryModal: React.FC<AddEntryModalProps> = ({ entry, onClose, onSave, onSaveMultiple, initialData, initialCategory, onInitiateRefuelScan, scannedOdometer, onInitiateOdometerScan, onOdometerScanConsumed }) => {
  const [dateIso, setDateIso] = useState(getTodayIsoDate());
  const [odometerKm, setOdometerKm] = useState('');
  const [categories, setCategories] = useState<Category[]>([Category.Oil]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState('');
  const [recurrenceIntervalKm, setRecurrenceIntervalKm] = useState('');
  
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[] | null>(null);

  const [lastEdited, setLastEdited] = useState<LastEditedFuelField | null>(null);

  const isCompletingScheduled = entry?.status === 'scheduled';
  const isFuelEntry = !parsedEntries && (categories.length === 1 && categories[0] === Category.Fuel);

  useEffect(() => {
    // This effect runs when the modal is opened (when its props change)
    if (entry) { // Editing an existing entry
        setDateIso(entry.dateIso);
        setOdometerKm(String(entry.odometerKm));
        setCategories(entry.categories);
        setDescription(entry.description);
        setCost(String(entry.cost));
        setLiters(entry.liters ? String(entry.liters) : '');
        setPricePerLiter(entry.pricePerLiter ? String(entry.pricePerLiter) : '');
        setIsRecurring(entry.isRecurring || false);
        setRecurrenceIntervalDays(entry.recurrenceIntervalDays ? String(entry.recurrenceIntervalDays) : '');
        setRecurrenceIntervalKm(entry.recurrenceIntervalKm ? String(entry.recurrenceIntervalKm) : '');
    } else if (initialData) { // Opened from a fuel scan result
        setCategories([Category.Fuel]);
        setDescription('Fuel top-up');
        if (initialData.cost) setCost(String(Math.round(initialData.cost)));
        if (initialData.liters) setLiters(String(initialData.liters.toFixed(2)));
        if (initialData.pricePerLiter) setPricePerLiter(String(initialData.pricePerLiter.toFixed(2)));
    } else if (initialCategory === Category.Fuel) { // Opened from "Log Fuel" button
        setCategories([Category.Fuel]);
        setDescription('Fuel top-up');
        // Reset all other fields
        setDateIso(getTodayIsoDate());
        setOdometerKm('');
        setCost('');
        setLiters('');
        setPricePerLiter('');
        setIsRecurring(false);
    } else { // Opened for a generic new entry
        // Reset all fields to default
        setDateIso(getTodayIsoDate());
        setOdometerKm('');
        setCategories([Category.Oil]);
        setDescription('');
        setCost('');
        setLiters('');
        setPricePerLiter('');
        setIsRecurring(false);
    }
  }, [entry, initialData, initialCategory]);

  useEffect(() => {
    if (scannedOdometer !== null) {
        setOdometerKm(String(scannedOdometer));
        onOdometerScanConsumed();
    }
  }, [scannedOdometer, onOdometerScanConsumed]);

  // Auto-calculation logic for fuel entries
  useEffect(() => {
    if (!isFuelEntry || !lastEdited) return;

    const costNum = parseFloat(cost);
    const litersNum = parseFloat(liters);
    const priceNum = parseFloat(pricePerLiter);

    // Two fields are needed to calculate the third.
    if (lastEdited !== 'price' && !isNaN(costNum) && !isNaN(litersNum) && litersNum > 0) {
        setPricePerLiter((costNum / litersNum).toFixed(2));
    } else if (lastEdited !== 'cost' && !isNaN(litersNum) && !isNaN(priceNum)) {
        setCost(Math.round(litersNum * priceNum).toString());
    } else if (lastEdited !== 'liters' && !isNaN(costNum) && !isNaN(priceNum) && priceNum > 0) {
        setLiters((costNum / priceNum).toFixed(2));
    }

  }, [cost, liters, pricePerLiter, lastEdited, isFuelEntry]);
  
  const handleCategorySelect = (category: Category) => {
    if (isCompletingScheduled) return; // Don't allow changing category for a scheduled task

    setCategories(prev => {
      const isFuelSelectedExclusively = prev.length === 1 && prev[0] === Category.Fuel;

      if (category === Category.Fuel) {
        // Toggle Fuel. If it's on, turn it off and default to 'Other'. If it's off, turn it on exclusively.
        return isFuelSelectedExclusively ? [Category.Other] : [Category.Fuel];
      }
      
      // If a non-fuel category is clicked
      const newCategories = prev.filter(c => c !== Category.Fuel); // Always remove fuel if it was there
      
      if (newCategories.includes(category)) {
        // It's already selected, so deselect it
        const afterDeselect = newCategories.filter(c => c !== category);
        // If we've deselected the last item, default to 'Other' to avoid empty state
        if (afterDeselect.length === 0) {
          return [Category.Other];
        }
        return afterDeselect;
      } else {
        // It's not selected, so add it
        return [...newCategories, category];
      }
    });
  };

  const handleAiSort = async () => {
    if (!description.trim()) {
        setAiError("Please enter a description first.");
        return;
    }
    if (!process.env.API_KEY) {
        setAiError("AI features are not configured. API_KEY is missing.");
        return;
    }

    setIsAiCategorizing(true);
    setAiError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are an assistant for a motorcycle maintenance log app. Analyze the user's text, break it down into individual service items, and return a JSON object.

For each item, provide:
1. A concise description (e.g., "Replaced oil filter").
2. A category from this list: 'Oil', 'Parts', 'Labour', 'Other'.
3. The cost as a number.

IMPORTANT:
- You MUST extract all maintenance tasks mentioned.
- If a specific cost is mentioned for an item, extract that cost.
- If no cost is mentioned for an item (e.g., "chain was lubricated"), you MUST set its 'cost' to 0.
- If an item has no cost, categorize it as 'Other' unless its category is obvious (like an 'Oil change').
- Do not include fuel-related tasks.

User input: "${description}"`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                items: {
                    type: Type.ARRAY,
                    description: "A list of maintenance items found in the text.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: {
                                type: Type.STRING,
                                description: "A concise description of the service item."
                            },
                            category: {
                                type: Type.STRING,
                                description: "The category of the maintenance item.",
                                enum: Object.values(Category).filter(c => c !== Category.Fuel),
                            },
                            cost: {
                                type: Type.NUMBER,
                                description: "The cost associated with this item. Must be 0 if no price is mentioned."
                            }
                        },
                        required: ["description", "category", "cost"]
                    }
                }
            }
        };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const parsedData = JSON.parse(result.text);

        if (parsedData.items && parsedData.items.length > 0) {
             const validatedEntries = parsedData.items.filter((item: any) => item.description && item.category && item.cost !== undefined);
            if (validatedEntries.length > 0) {
                setParsedEntries(validatedEntries);
            } else {
                 setAiError("AI could not extract valid items from the description.");
            }
        } else {
            setAiError("AI could not extract any items from your description. Please try rephrasing.");
        }

    } catch (err) {
        console.error("AI Sort Error:", err);
        setAiError(`An error occurred. ${err instanceof Error ? err.message : ''}`);
    } finally {
        setIsAiCategorizing(false);
    }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const odometerNum = parseInt(odometerKm, 10);
    
    if (isNaN(odometerNum) || !dateIso) {
        alert('Please fill out Odometer and Date before saving.');
        return;
    }

    if (parsedEntries) { // AI-sorted entries
        const entriesToSave = parsedEntries.map(p => ({
            dateIso,
            odometerKm: odometerNum,
            categories: [p.category], // Category is now a single value from the parsed item
            description: p.description,
            cost: p.cost,
            status: 'logged' as 'logged',
        }));
        onSaveMultiple(entriesToSave);
        return;
    }
    
    // --- Manual single entry logic ---
    const costNum = parseInt(cost, 10);
    const litersNum = liters ? parseFloat(liters) : undefined;
    const pricePerLiterNum = pricePerLiter ? parseFloat(pricePerLiter) : undefined;
    const intervalDays = recurrenceIntervalDays ? parseInt(recurrenceIntervalDays, 10) : undefined;
    const intervalKm = recurrenceIntervalKm ? parseInt(recurrenceIntervalKm, 10) : undefined;

    if (isNaN(costNum) || !description.trim()) {
        alert('Please fill out all required fields correctly.');
        return;
    }
    if (categories.length === 0) {
        alert('Please select at least one category.');
        return;
    }
     if (isFuelEntry && (!litersNum || litersNum <= 0)) {
        alert('Please enter a valid amount for liters for fuel entries.');
        return;
    }
    if (isRecurring && !intervalDays && !intervalKm) {
        alert('Please set at least one recurrence interval (days or km).');
        return;
    }

    onSave({
      ...entry, 
      dateIso,
      odometerKm: odometerNum,
      categories,
      description,
      cost: costNum,
      liters: isFuelEntry ? litersNum : undefined,
      pricePerLiter: isFuelEntry ? pricePerLiterNum : undefined,
      status: 'logged', 
      isRecurring: !isFuelEntry && isRecurring,
      recurrenceIntervalDays: !isFuelEntry && isRecurring ? intervalDays : undefined,
      recurrenceIntervalKm: !isFuelEntry && isRecurring ? intervalKm : undefined,
    });
  };

  const getModalTitle = () => {
    if (parsedEntries) return 'Review AI Entries';
    if (isCompletingScheduled) return 'Log Scheduled Task';
    if (isFuelEntry) return 'Log Fuel';
    return entry ? 'Edit Maintenance Entry' : 'Add Maintenance Entry';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white">{getModalTitle()}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DatePicker 
            label="Date"
            selectedDate={dateIso}
            onSelectDate={setDateIso}
          />
          <div className="relative">
             <InputField label="Odometer (KM)" type="number" value={odometerKm} onChange={e => setOdometerKm(e.target.value)} required />
             <button
                type="button"
                onClick={onInitiateOdometerScan}
                className="absolute top-8 right-0 flex items-center h-10 px-3 text-indigo-400 hover:text-indigo-300"
                aria-label="Scan Odometer"
             >
                <ScanIcon />
            </button>
          </div>
          
          {parsedEntries ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-200">AI Generated Entries</h3>
                <button
                  type="button"
                  onClick={() => setParsedEntries(null)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Clear & Edit Manually
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-gray-700/50 rounded-lg">
                {parsedEntries.map((item, index) => (
                  <div key={index} className="bg-gray-900/50 p-3 rounded-md">
                    <p className="font-semibold text-gray-100">{item.description}</p>
                    <div className="flex justify-between items-center mt-1 text-sm">
                      <span className="text-indigo-300 font-medium">{item.category}</span>
                      {item.cost > 0 && (
                        <span className="font-mono text-green-400">PKR {item.cost.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => {
                        const isSelected = categories.includes(cat);
                        // A button is disabled if we are completing a scheduled task, 
                        // or if Fuel is selected and this button is NOT the Fuel button.
                        const isDisabled = isCompletingScheduled || (isFuelEntry && cat !== Category.Fuel);

                        return (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => handleCategorySelect(cat)}
                                disabled={isDisabled}
                                className={`
                                    py-1.5 px-4 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
                                    disabled:cursor-not-allowed disabled:opacity-50
                                    ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                                `}
                            >
                                {cat}
                            </button>
                        )
                    })}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                    {!isFuelEntry && (
                        <button 
                            type="button" 
                            onClick={handleAiSort}
                            disabled={isAiCategorizing || !description.trim()}
                            className="flex items-center gap-1.5 text-xs py-1 px-2 bg-indigo-500/50 hover:bg-indigo-500/80 text-indigo-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Automatically split description into categorized entries"
                        >
                          {isAiCategorizing ? <SpinnerIcon /> : <SparklesIcon />}
                          AI Sort
                        </button>
                    )}
                </div>
                <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    placeholder={isFuelEntry ? 'e.g., Full tank' : 'Try the AI Sort! e.g., Oil change 1250, new air filter for 550, and chain adjustment'}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] resize-y"
                    rows={3}
                />
              </div>
              {aiError && <p className="text-xs text-red-400 mt-2">{aiError}</p>}
              
              {isFuelEntry ? (
                <div className="p-4 bg-gray-700/50 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-300">Enter any two to auto-calculate.</p>
                        <button type="button" onClick={onInitiateRefuelScan} className="flex items-center gap-2 text-sm py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors">
                            <ScanIcon />
                            Scan for Refuel
                        </button>
                    </div>
                    <InputField label="Total Cost (PKR)" type="number" value={cost} onChange={e => { setCost(e.target.value); setLastEdited('cost'); }} required />
                    <InputField label="Total Liters (L)" type="number" step="0.01" value={liters} onChange={e => { setLiters(e.target.value); setLastEdited('liters'); }} required />
                    <InputField label="Price per Liter (PKR)" type="number" step="0.01" value={pricePerLiter} onChange={e => { setPricePerLiter(e.target.value); setLastEdited('price'); }} />
                </div>
              ) : (
                  <InputField label="Total Cost (PKR)" type="number" value={cost} onChange={e => setCost(e.target.value)} required />
              )}

              {!isFuelEntry && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={e => setIsRecurring(e.target.checked)}
                            className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-200 font-medium">Make this a recurring task</span>
                    </label>
                    {isRecurring && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded-lg">
                            <InputField label="Recur every (days)" type="number" value={recurrenceIntervalDays} onChange={e => setRecurrenceIntervalDays(e.target.value)} placeholder="e.g., 90" />
                            <InputField label="Recur every (km)" type="number" value={recurrenceIntervalKm} onChange={e => setRecurrenceIntervalKm(e.target.value)} placeholder="e.g., 1500" />
                        </div>
                    )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md font-semibold text-white transition-colors">
                {isCompletingScheduled ? 'Log Task' : (parsedEntries ? 'Save All Entries' : 'Save Entry')}
            </button>
          </div>
        </form>
      </div>
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  );
};


interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input 
            {...props}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);

const ScanIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 10a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zM15 10a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);