import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types';

interface ManageVehiclesModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onAddVehicle: (name: string, year: number | undefined, engineCc: number | undefined) => void;
  onUpdateVehicle: (id: number, data: Partial<Omit<Vehicle, 'id'>>) => void;
  onDeleteVehicle: (id: number) => void;
}

export const ManageVehiclesModal: React.FC<ManageVehiclesModalProps> = ({ vehicles, onClose, onAddVehicle, onUpdateVehicle, onDeleteVehicle }) => {
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [engineCc, setEngineCc] = useState('');

    useEffect(() => {
        if (editingVehicle) {
            setName(editingVehicle.name);
            setYear(editingVehicle.year ? String(editingVehicle.year) : '');
            setEngineCc(editingVehicle.engineCc ? String(editingVehicle.engineCc) : '');
        } else {
            setName('');
            setYear('');
            setEngineCc('');
        }
    }, [editingVehicle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Vehicle name is required.');
            return;
        }

        const yearNum = year ? parseInt(year, 10) : undefined;
        const engineCcNum = engineCc ? parseInt(engineCc, 10) : undefined;
        
        if (year && (isNaN(yearNum!) || year.length !== 4)) {
            alert('Please enter a valid 4-digit year.');
            return;
        }
        if (engineCc && isNaN(engineCcNum!)) {
            alert('Please enter a valid number for Engine CC.');
            return;
        }

        if (editingVehicle) {
            onUpdateVehicle(editingVehicle.id, { name: name.trim(), year: yearNum, engineCc: engineCcNum });
        } else {
            onAddVehicle(name.trim(), yearNum, engineCcNum);
        }
        setEditingVehicle(null);
    };
    
    const handleEditClick = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
    }
    
    const handleCancelEdit = () => {
        setEditingVehicle(null);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-white">Manage Vehicles</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-200">{editingVehicle ? `Editing: ${editingVehicle.name}` : 'Add New Vehicle'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                           <InputField label="Vehicle Name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Yamaha YBR-125" required />
                        </div>
                        <InputField label="Year of Manufacture" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2023" />
                        <InputField label="Engine (CC)" type="number" value={engineCc} onChange={e => setEngineCc(e.target.value)} placeholder="e.g., 125" />
                    </div>
                    <div className="flex gap-2 justify-end">
                        {editingVehicle && (
                            <button type="button" onClick={handleCancelEdit} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Cancel</button>
                        )}
                        <button type="submit" className={`py-2 px-4 rounded-md font-semibold text-white ${editingVehicle ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-500 hover:bg-green-600'}`}>
                            {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <h3 className="text-lg font-semibold text-gray-200">Your Vehicles</h3>
                    {vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                            <div key={vehicle.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="text-gray-100 font-medium">{vehicle.name}</p>
                                    {(vehicle.year || vehicle.engineCc) && (
                                        <p className="text-xs text-gray-400">
                                            {[vehicle.year, vehicle.engineCc && `${vehicle.engineCc}cc`].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleEditClick(vehicle)} className="p-2 rounded-full hover:bg-gray-600 text-gray-400 hover:text-white" aria-label="Edit vehicle">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => onDeleteVehicle(vehicle.id)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400" aria-label="Delete vehicle">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No vehicles yet. Add one above!</p>
                    )}
                </div>

                <div className="flex justify-end pt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors">Close</button>
                </div>
            </div>
            {/* Background click handler */}
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};


const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input 
            {...props}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);