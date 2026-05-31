import React from 'react';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Room, Bed } from '../api/types';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
type Status = 'full' | 'partial' | 'available';

const getStatus = (beds: Bed[]): Status => {
  if (!beds.length) return 'available';
  const occ = beds.filter((b) => b.is_occupied).length;
  if (occ === beds.length) return 'full';
  return occ === 0 ? 'available' : 'partial';
};

const STATUS_META: Record<Status, { label: string; badge: string; bar: string }> = {
  full:      { label: 'Full',      badge: 'bg-red-50 text-red-600 border border-red-100',          bar: 'bg-red-500'     },
  partial:   { label: 'Partial',   badge: 'bg-amber-50 text-amber-700 border border-amber-100',    bar: 'bg-amber-500'   },
  available: { label: 'Available', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100', bar: 'bg-emerald-500' },
};

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────
interface RoomCardProps {
  room: Room;
  beds: Bed[];
  manageMode: boolean;
  onOpen: (room: Room) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  isDeleting?: boolean;
  isEditing?: boolean;
  selected?: boolean;
  onToggleSelect?: (roomId: string) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
const RoomCard: React.FC<RoomCardProps> = ({
  room, beds, manageMode,
  onOpen, onEditRoom, onDeleteRoom,
  isDeleting = false,
  isEditing = false,
  selected = false,
  onToggleSelect,
}) => {
  const vacantFilterActive = new URLSearchParams(window.location.search).get('filter') === 'vacant';
  const occupied = beds.filter((b) => b.is_occupied).length;
  const total    = beds.length;
  const vacant   = total - occupied;
  const isFullyOccupied = total > 0 && occupied === total;
  const bgClass = vacantFilterActive && isFullyOccupied ? '!bg-[#fff5f5]' : '';
  const accentClass = vacantFilterActive && vacant > 0 ? 'border-l-4 border-green-500' : '';

  const pct      = total > 0 ? (occupied / total) * 100 : 0;
  const status   = getStatus(beds);
  const meta     = STATUS_META[status];

  const isDisabled = isDeleting || isEditing;

  return (
    <div className={`card overflow-hidden transition-all duration-300 ${bgClass} ${accentClass} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* ── Main row ──────────────────────────────────────────────────────── */}
      <div className="flex items-stretch">
        {manageMode && onToggleSelect && (
          <div className="flex items-center pl-4 pr-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(room.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-main-border text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
              aria-label={`Select room ${room.room_number}`}
            />
          </div>
        )}
        {/* Tap area — opens detail sheet */}
        <button
          type="button"
          onClick={() => onOpen(room)}
          disabled={isDisabled}
          className="flex-1 text-left p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Room number badge */}
              <div className="w-11 h-11 bg-main-bg rounded-lg flex items-center justify-center border border-main-border flex-shrink-0">
                <span className="text-lg font-bold text-main-text leading-none">
                  {room.room_number}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-main-text leading-tight">
                  Room {room.room_number}
                </p>
                <p className="text-sm text-black/60 font-medium mt-0.5">
                  {occupied}/{total} beds occupied
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {vacantFilterActive && vacant > 0 ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse-subtle">
                  {vacant} bed{vacant !== 1 ? 's' : ''} free
                </span>
              ) : (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${meta.badge}`}>
                  {meta.label}
                </span>
              )}
              {!manageMode && (
                <ChevronRight size={16} className="text-black/40" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Bed label pills preview */}
          {total > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {beds.slice(0, 6).map((bed) => (
                <span
                  key={bed.id}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    bed.is_occupied
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-gray-50 text-black/40 border border-gray-100'
                  }`}
                >
                  {bed.bed_label || 'Bed'}
                </span>
              ))}
              {total > 6 && (
                <span className="text-[10px] font-medium text-black/40 self-center">
                  +{total - 6} more
                </span>
              )}
            </div>
          )}
        </button>

        {/* Manage-mode icon strip */}
        {manageMode && (
          <div className="flex flex-col justify-center border-l border-main-border px-3 gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditRoom(room); }}
              disabled={isDisabled}
              className="w-8 h-8 rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-main-border disabled:opacity-50"
              title="Rename room"
            >
              <Pencil size={14} className="text-black/60" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeleteRoom(room); }}
              disabled={isDisabled}
              className="w-8 h-8 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-100 disabled:opacity-50"
              title="Delete room"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCard;

