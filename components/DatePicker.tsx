import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatIsoDate, getTodayIsoDate } from '../utils/dateUtils';

interface DatePickerProps {
    label: string;
    selectedDate: string; // YYYY-MM-DD
    onSelectDate: (date: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, selectedDate, onSelectDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate + 'T00:00:00'));
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = useMemo(() => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const days = [];
        while (date.getMonth() === currentMonth.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentMonth]);

    const startDayOfMonth = daysInMonth[0].getDay();

    const handleDateSelect = (day: Date) => {
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        onSelectDate(`${year}-${month}-${date}`);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const todayIso = getTodayIsoDate();

    return (
        <div className="relative" ref={pickerRef}>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex justify-between items-center"
            >
                <span>{formatIsoDate(selectedDate)}</span>
                <CalendarIcon />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-600"><ChevronLeftIcon /></button>
                        <span className="font-semibold text-white">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-600"><ChevronRightIcon /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="p-1">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-1">
                        {Array.from({ length: startDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                        {daysInMonth.map(day => {
                            const dateIso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                            const isSelected = dateIso === selectedDate;
                            const isToday = dateIso === todayIso;

                            return (
                                <button
                                    type="button"
                                    key={day.toISOString()}
                                    onClick={() => handleDateSelect(day)}
                                    className={`
                                        w-full aspect-square text-sm rounded-full transition-colors
                                        ${isSelected ? 'bg-indigo-600 text-white font-bold' : ''}
                                        ${!isSelected && isToday ? 'ring-1 ring-indigo-500 text-indigo-300' : ''}
                                        ${!isSelected && !isToday ? 'text-gray-200 hover:bg-gray-600' : ''}
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);
