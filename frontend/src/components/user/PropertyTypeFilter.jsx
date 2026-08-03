import React from 'react';
import {
  Building2,
  Home,
  Palmtree,
  Hotel,
  Building,
  BedDouble,
  LayoutGrid
} from 'lucide-react';

const PropertyTypeFilter = ({ selectedType, onSelectType }) => {
  const types = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Hotel', label: 'Hotel', icon: Building2 },
    { id: 'Villa', label: 'Villa', icon: Home },
    { id: 'Resort', label: 'Resort', icon: Palmtree },
    { id: 'Homestay', label: 'Homestay', icon: Hotel },
    { id: 'Hostel', label: 'Hostel', icon: Building },
    { id: 'PG', label: 'PG', icon: BedDouble },
  ];

  return (
    <div className="flex justify-start sm:justify-center gap-4 md:gap-8 lg:gap-10 overflow-x-auto px-5 py-4 no-scrollbar">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`
              flex flex-col items-center gap-1.5 min-w-[56px] group outline-none transition-all duration-300
            `}
          >
            <div 
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
                transition-all duration-300
                ${isSelected
                  ? 'scale-105 shadow-md font-bold text-slate-900'
                  : 'bg-white text-slate-700 hover:bg-gray-50 border border-gray-100'
                }
              `}
              style={isSelected ? { background: 'var(--color-theme-gradient, var(--color-surface, #FFD000))' } : {}}
            >
              <Icon size={20} strokeWidth={2} />
            </div>

            <span className={`
              text-[10px] font-medium transition-colors leading-tight
              ${isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-600'}
            `}>
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PropertyTypeFilter;
