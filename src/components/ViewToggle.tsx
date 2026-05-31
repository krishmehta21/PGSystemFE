import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => (
  <div className="flex bg-main-bg border border-main-border rounded-lg p-0.5 gap-0.5 w-full">
    <button
      onClick={() => onChange('grid')}
      className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
        value === 'grid'
          ? 'bg-white shadow-sm text-main-text border border-main-border'
          : 'text-black/60 hover:text-main-text'
      }`}
    >
      <LayoutGrid size={14} />
      Grid
    </button>
    <button
      onClick={() => onChange('list')}
      className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
        value === 'list'
          ? 'bg-white shadow-sm text-main-text border border-main-border'
          : 'text-black/60 hover:text-main-text'
      }`}
    >
      <List size={14} />
      List
    </button>
  </div>
);

export default ViewToggle;

