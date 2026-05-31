import React from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus, Pencil, Trash2, PlusCircle,
  MinusCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Loader from './Loader';
import type { Room, Bed, Tenant } from '../api/types';

// ──────────────────────────────────────────────────────────────────────────────
// Sub-types
// ──────────────────────────────────────────────────────────────────────────────
interface RoomDetailSheetProps {
  room: Room;
  beds: Bed[];
  tenantByBed: Record<string, Tenant>;
  manageMode: boolean;
  addingBed: boolean;
  deletingBedId: string | null;
  onClose: () => void;
  onAssign: (room: Room, bed: Bed) => void;
  onNavigateTenant: (tenantId: string) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onAddBed: (room: Room) => void;
  onDeleteBed: (bed: Bed) => void;
}

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

const STATUS_META = {
  full:      { label: 'Full',      badge: 'bg-red-50 text-red-600 border border-red-100',          bar: 'bg-red-500'     },
  partial:   { label: 'Partial',   badge: 'bg-amber-50 text-amber-700 border border-amber-100',    bar: 'bg-amber-500'   },
  available: { label: 'Available', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100', bar: 'bg-emerald-500' },
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
const RoomDetailSheet: React.FC<RoomDetailSheetProps> = ({
  room, beds, tenantByBed, manageMode,
  addingBed, deletingBedId,
  onClose, onAssign, onNavigateTenant,
  onEditRoom, onDeleteRoom, onAddBed, onDeleteBed,
}) => {
  const occupied = beds.filter((b) => b.is_occupied).length;
  const total    = beds.length;
  const pct      = total > 0 ? (occupied / total) * 100 : 0;
  const status   = getStatus(beds);
  const meta     = STATUS_META[status];

  return createPortal(
    /* Sheet layer */
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <button
        type="button"
        aria-label="Close room details"
        className="fixed inset-0 z-[100] cursor-default bg-transparent pointer-events-auto"
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[101] mx-auto bg-white w-full max-w-[430px] rounded-t-2xl flex flex-col max-h-[90vh] pointer-events-auto shadow-[0_-12px_40px_rgba(0,0,0,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex justify-center flex-shrink-0">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="h-14 flex items-center justify-center relative mb-1">
            <button
              onClick={onClose}
              className="absolute left-0 p-2 -ml-2 text-black/60 hover:text-main-text transition-colors rounded-md active:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold text-main-text flex items-center gap-2">
                Room {room.room_number}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${meta.badge}`}>
                  {meta.label}
                </span>
              </h2>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Manage-mode room actions */}
          {manageMode && (
            <div className="flex gap-2.5 mt-3">
              <button
                onClick={() => onEditRoom(room)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-black/60 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-main-border"
              >
                <Pencil size={14} /> Rename Room
              </button>
              <button
                onClick={() => onDeleteRoom(room)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2.5 rounded-lg transition-colors border border-red-100"
              >
                <Trash2 size={14} /> Delete Room
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable bed list ─────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 border-t border-main-border">
          {beds.length === 0 ? (
            <div className="p-8 text-center text-black/60 text-sm">
              No beds in this room yet.
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {beds.map((bed) => {
                const tenant  = tenantByBed[bed.id];
                const isPaid  = tenant?.rent_status === 'paid';
                const deleting = deletingBedId === bed.id;

                return (
                  <div
                    key={bed.id}
                    className={`px-5 py-3.5 transition-opacity ${deleting ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left: tenant info or empty state */}
                      <div className="flex-1 min-w-0">
                        {bed.is_occupied && tenant ? (
                          /* ── Occupied ─────────────────────────────── */
                          <button
                            onClick={() => { onClose(); onNavigateTenant(tenant.id); }}
                            className="w-full flex items-center gap-3 px-1 py-1 min-h-[56px] tap-target group text-left"
                          >
                            <div className="shrink-0">
                              <div className="w-10 h-10 rounded-lg bg-main-text flex items-center justify-center text-white font-semibold text-sm">
                                {tenant.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold leading-tight truncate text-main-text">
                                {tenant.name}
                              </p>
                              <p className="text-xs text-black/60 font-medium truncate mt-0.5">
                                ₹{Number(tenant.rent_amount).toLocaleString('en-IN')} · {tenant.phone}
                              </p>
                            </div>

                            <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            
                            <ChevronRight size={16} className="text-black/40 shrink-0 group-hover:text-black/60 transition-colors" />
                          </button>
                        ) : (
                          /* ── Empty ────────────────────────────────── */
                          (() => {
                            const shouldHighlightOld = new URLSearchParams(window.location.search).get('highlight_old') === 'true';
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            
                            const isLongVacant = !bed.is_occupied && bed.created_at && new Date(bed.created_at) < thirtyDaysAgo;
                            const longVacant = shouldHighlightOld && isLongVacant;

                            return (
                              <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${longVacant ? 'bg-amber-500/10 border border-amber-500/20 shadow-sm' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    longVacant ? 'bg-amber-100 border border-amber-200 text-amber-700' : 'bg-gray-50 border border-main-border text-black/40'
                                  }`}>
                                    <UserPlus size={16} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-black/80 flex items-center gap-1.5">
                                      {bed.bed_label || 'Empty Bed'}
                                      {longVacant && (
                                        <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                                          ⚠ Vacant &gt;30d
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-black/40 font-medium">
                                      No tenant assigned
                                    </p>
                                  </div>
                                </div>
                                {/* Assign — always visible for empty beds */}
                                <button
                                  onClick={() => { onClose(); setTimeout(() => onAssign(room, bed), 50); }}
                                  className="bg-main-text text-white text-xs font-semibold px-3 py-2 rounded-md tap-target flex items-center gap-1.5 hover:bg-accent transition-colors flex-shrink-0"
                                >
                                  <UserPlus size={12} /> Assign
                                </button>
                              </div>
                            );
                          })()
                        )}
                      </div>

                      {/* Delete bed — manage mode + empty only */}
                      {manageMode && !bed.is_occupied && (
                        <button
                          onClick={() => !deleting && onDeleteBed(bed)}
                          disabled={deleting}
                          className="w-8 h-8 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 border border-red-100"
                          title="Remove bed"
                        >
                          {deleting
                            ? <Loader inline size="sm" />
                            : <MinusCircle size={14} className="text-red-500" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add bed — manage mode */}
          {manageMode && (
            <div className="px-5 pb-5 pt-3">
              <button
                onClick={() => !addingBed && onAddBed(room)}
                disabled={addingBed}
                className="w-full border border-dashed border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 text-black/60 font-medium text-sm hover:border-main-text hover:text-main-text transition-colors disabled:opacity-50"
              >
                {addingBed
                  ? <><Loader inline size="sm" /> Adding bed.</>
                  : <><PlusCircle size={14} /> Add Bed</>
                }
              </button>
            </div>
          )}

          {/* Bottom safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RoomDetailSheet;

