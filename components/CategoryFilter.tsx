import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

const filterCategories = [Category.Oil, Category.Parts, Category.Labour, Category.Other];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div>
        <div className="flex flex-wrap gap-2">
            <FilterButton
                label="All"
                isActive={selectedCategory === null}
                onClick={() => onSelectCategory(null)}
            />
            {filterCategories.map(category => (
                <FilterButton
                    key={category}
                    label={category}
                    isActive={selectedCategory === category}
                    onClick={() => onSelectCategory(category)}
                />
            ))}
        </div>
    </div>
  );
};

interface FilterButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick }) => {
    const baseClasses = "py-1.5 px-4 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500";
    const activeClasses = "bg-indigo-600 text-white";
    const inactiveClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    )
}
