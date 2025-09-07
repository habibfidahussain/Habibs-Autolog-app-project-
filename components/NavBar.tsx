import React from 'react';

export type Page = 'history' | 'fuel' | 'status' | 'ai_assistant' | 'summary' | 'stats';

interface NavBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);

const FuelIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const StatusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const SummaryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const StatsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const AIAssistantIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 6.343l-2.828 2.828M12 21v-4m-2-2h4m5.657-2.828l-2.828-2.828M18 5h4m-2 2v-4m-2.828 11.657l2.828 2.828M3 15a4 4 0 004 4h4a4 4 0 004-4v-4a4 4 0 00-4-4H7a4 4 0 00-4 4v4z" />
    </svg>
);


const navItems: { id: Page; label: string; icon: JSX.Element }[] = [
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
    { id: 'fuel', label: 'Fuel', icon: <FuelIcon /> },
    { id: 'status', label: 'Status', icon: <StatusIcon /> },
    { id: 'ai_assistant', label: 'Assistant', icon: <AIAssistantIcon /> },
    { id: 'summary', label: 'Summary', icon: <SummaryIcon /> },
    { id: 'stats', label: 'Stats', icon: <StatsIcon /> },
];

export const NavBar: React.FC<NavBarProps> = ({ currentPage, onNavigate }) => {
    return (
        <nav className="mt-6 bg-gray-800 rounded-lg shadow-lg overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex justify-center gap-1.5 p-1.5">
                {navItems.map(item => {
                    const isActive = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                                flex flex-shrink-0 items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ease-in-out
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:ring-indigo-500
                                ${isActive 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                }
                            `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {item.icon}
                            <span className="text-sm font-semibold hidden sm:inline">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};