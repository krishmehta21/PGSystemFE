import React from 'react';

export type SortOption = 'room_asc' | 'occupancy_desc' | 'available_first';

interface SortControlProps {
  value: SortOption;
  onChange: (val: SortOption) => void;
}

const SORT_CHIPS: { label: string; value: SortOption }[] = [
  { label: 'Room No.', value: 'room_asc' },
  { label: 'Fullest First', value: 'occupancy_desc' },
  { label: 'Available First', value: 'available_first' },
];

const SortControl: React.FC<SortControlProps> = ({ value, onChange }) => (
  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
    {SORT_CHIPS.map((chip) => (
      <button
        key={chip.value}
        onClick={() => onChange(chip.value)}
        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
          value === chip.value
            ? 'bg-main-text text-white border-main-text'
            : 'bg-white text-black/60 border-main-border hover:border-gray-300'
        }`}
      >
        {chip.label}
      </button>
    ))}
  </div>
);

export default SortControl;

