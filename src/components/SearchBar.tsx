import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search room number...',
}) => (
  <div className="relative">
    <Search
      size={16}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-main-bg border border-main-border rounded-lg pl-10 pr-9 py-2.5 text-sm font-medium text-main-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 p-0.5"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchBar;

