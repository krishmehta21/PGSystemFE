import React from 'react';
import type { Room, Bed } from '../api/types';

interface RoomTileProps {
  room: Room;
  beds: Bed[];
  onClick: () => void;
  manageMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (roomId: string) => void;
}

const MAX_DOTS = 8;

const RoomTile: React.FC<RoomTileProps> = ({
  room, beds, onClick,
  manageMode = false,
  selected = false,
  onToggleSelect,
}) => {
  const vacantFilterActive = new URLSearchParams(window.location.search).get('filter') === 'vacant';
  const occupied   = beds.filter((b) => b.is_occupied).length;
  const total      = beds.length;
  const vacant     = total - occupied;
  const isFullyOccupied = total > 0 && occupied === total;
  const bgClass = vacantFilterActive && isFullyOccupied ? '!bg-[#fff5f5]' : '';
  const accentClass = vacantFilterActive && vacant > 0 ? 'border-l-4 border-green-500' : '';

  const pct        = total > 0 ? (occupied / total) * 100 : 0;
  const extraBeds  = total > MAX_DOTS ? total - MAX_DOTS : 0;
  const visibleBeds = beds.slice(0, MAX_DOTS);

  const isAvailable = beds.some((b) => !b.is_occupied);

  const barColor = isFullyOccupied
    ? 'bg-red-500'
    : isAvailable
    ? 'bg-emerald-500'
    : 'bg-amber-500';

  const statusLabel = isFullyOccupied
    ? 'Full'
    : isAvailable
    ? 'Available'
    : 'Pending';

  const statusBadge = isFullyOccupied
    ? 'bg-red-50/50 text-red-600 border-red-100'
    : isAvailable
    ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100'
    : 'bg-amber-50/50 text-amber-700 border-amber-100';

  const dotOccupied = 'bg-emerald-500';

  return (
    <div
      className={`card relative w-full overflow-hidden hover:border-main-border active:scale-[0.98] transition-all duration-150 ${bgClass} ${accentClass} ${
        manageMode && selected ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
      }`}
    >
      {manageMode && onToggleSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(room.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 z-10 w-4 h-4 rounded-full border-main-border text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
          aria-label={`Select room ${room.room_number}`}
        />
      )}

      <button
        type="button"
        onClick={onClick}
        className="w-full p-4 flex flex-col gap-3 text-left rounded-[inherit]"
      >
        {/* Room number + count */}
        <div className="flex items-start justify-between">
          <span className="text-2xl font-bold leading-none text-main-text">
            {room.room_number}
          </span>
          {manageMode && onToggleSelect ? (
            <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : vacantFilterActive && vacant > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              {vacant} free
            </span>
          ) : (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadge}`}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Bed dots */}
        <div className="flex flex-wrap gap-1.5 min-h-[18px]">
          {visibleBeds.map((bed) => (
            <span
              key={bed.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                bed.is_occupied ? dotOccupied : 'bg-gray-200'
              }`}
            />
          ))}
          {extraBeds > 0 && (
            <span className="text-[10px] font-medium text-black/40 self-center">
              +{extraBeds}
            </span>
          )}
          {total === 0 && (
            <span className="text-[11px] font-medium text-black/40">No beds</span>
          )}
        </div>

        {/* Progress bar + fraction */}
        <div className="space-y-1">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-black/60">
            {occupied}/{total} occupied
          </p>
        </div>
      </button>
    </div>
  );
};

export default RoomTile;

