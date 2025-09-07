import React, { useState, useRef, useEffect } from 'react';
import type { Vehicle } from '../types';

interface HeaderProps {
  vehicles: Vehicle[];
  currentVehicle: Vehicle;
  onSelectVehicle: (id: number) => void;
  onAddEntryClick: () => void;
  onManageVehiclesClick: () => void;
  onVehicleSettingsClick: () => void;
  onAppSettingsClick: () => void;
  onHelpClick: () => void;
  onMaintenanceGuideClick: () => void;
  onLogFuelClick: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  return (
    <header className="py-3 border-b border-gray-700/50">
      <div className="flex justify-between items-center gap-4">
        {/* Left Side: Logo and Vehicle Selector */}
        <VehicleSelector
          currentVehicle={props.currentVehicle}
          vehicles={props.vehicles}
          onSelectVehicle={props.onSelectVehicle}
        />

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={props.onLogFuelClick}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-2 px-3 rounded-lg transition-colors duration-300"
            title="Log Fuel"
          >
            <FuelPumpIcon />
            <span className="hidden md:inline">Log Fuel</span>
          </button>
          <button
            onClick={props.onAddEntryClick}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300 shadow-lg"
            title="Add Maintenance Entry"
          >
            <AddIcon />
            <span className="hidden md:inline">Add Entry</span>
          </button>
          <MoreMenu {...props} />
        </div>
      </div>
    </header>
  );
};

// --- Child Components for Header ---

const VehicleSelector: React.FC<{
  currentVehicle: Vehicle;
  vehicles: Vehicle[];
  onSelectVehicle: (id: number) => void;
}> = ({ currentVehicle, vehicles, onSelectVehicle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    onSelectVehicle(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <AutoLogLogo />
        <div className="text-left">
          <span className="text-lg font-semibold text-white truncate block">{currentVehicle.name}</span>
          {(currentVehicle.year || currentVehicle.engineCc) && (
            <span className="text-xs font-normal text-gray-400">
              {[currentVehicle.year, currentVehicle.engineCc && `${currentVehicle.engineCc}cc`].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>
        <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {vehicles.map(vehicle => (
              <li key={vehicle.id}>
                <button
                  onClick={() => handleSelect(vehicle.id)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500/20 hover:text-white transition-colors"
                >
                  {vehicle.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MoreMenu: React.FC<Omit<HeaderProps, 'onAddEntryClick' | 'onLogFuelClick' | 'currentVehicle' | 'vehicles' | 'onSelectVehicle'>> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (handler: () => void) => {
    handler();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: <UsersIcon />, text: 'Manage Vehicles', onClick: () => handleMenuItemClick(props.onManageVehiclesClick) },
    { icon: <CogIcon />, text: 'Vehicle Settings', onClick: () => handleMenuItemClick(props.onVehicleSettingsClick) },
    { isSeparator: true },
    { icon: <BookOpenIcon />, text: 'Maintenance Guide', onClick: () => handleMenuItemClick(props.onMaintenanceGuideClick) },
    { isSeparator: true },
    { icon: <GlobeIcon />, text: 'App Settings', onClick: () => handleMenuItemClick(props.onAppSettingsClick) },
    { icon: <HelpIcon />, text: 'Help', onClick: () => handleMenuItemClick(props.onHelpClick) },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="More options"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {menuItems.map((item, index) =>
              item.isSeparator ? (
                <div key={`sep-${index}`} className="border-t border-gray-600 my-1" />
              ) : (
                <MenuItem key={item.text} icon={item.icon!} text={item.text!} onClick={item.onClick!} />
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


// --- Helper Components (Icons and MenuItem) ---

const AutoLogLogo: React.FC = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#818CF8" strokeWidth="2" strokeMiterlimit="10"/>
        <path d="M10.86 15.14L15.14 10.86" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 8V10" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 16H16" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 14H10" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 8V10" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500/20 hover:text-white transition-colors"
    >
      <span className="text-gray-400 w-5 h-5 flex items-center justify-center">{icon}</span>
      <span>{text}</span>
    </button>
  </li>
);

const AddIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const EllipsisVerticalIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

const CogIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const GlobeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.52-.524a2 2 0 012.828 0l.52.524M7.707 16.707l.52.524a2 2 0 002.828 0l.52-.524M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

const HelpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 1.152-.468 2.19-1.228 2.962-.76.772-1.768 1.28-2.772 1.53V15m0 4v.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
);

const BookOpenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const UsersIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
);

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 10a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zM15 10a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const FuelPumpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.707 2.293a1 1 0 010 1.414L9.414 7.414a1 1 0 01-1.414 0L2.293 1.707A1 1 0 013.707.293L4 4V2a1 1 0 011-1h4a1 1 0 011 1v2l.293-.293a1 1 0 011.414 0zM4 8a1 1 0 011-1h1v1.586l-1.293-1.293A1 1 0 113.293 8.707L5 10.414V13a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zm13-1a1 1 0 01-1 1H9.414l-1-1H16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1v-1h1a1 1 0 100-2H3v-1h1a1 1 0 100-2H3v-1h1a1 1 0 100-2H3V9h1v1.586l1.293-1.293A1 1 0 116.707 8.707L5 10.414V11h11V7z" clipRule="evenodd" />
    </svg>
);