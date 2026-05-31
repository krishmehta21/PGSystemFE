import React, { useState, useMemo } from 'react';
import {
  ChevronRight, ChevronLeft,
  Building2, BedDouble,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import Loader from './Loader';
import type { BulkRoomCreate, BulkRoomResult } from '../api/types';
import { bulkCreateRooms } from '../api/endpoints';

// ──────────────────────────────────────────────────────────────────────────────
// Shared field + input
// ──────────────────────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-base font-bold text-gray-700 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 font-medium mb-2">{hint}</p>}
    {children}
  </div>
);

const NumInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  min?: number; max?: number;
  placeholder?: string;
  autoFocus?: boolean;
}> = ({ value, onChange, min = 1, max = 99, placeholder, autoFocus }) => (
  <input
    type="number"
    min={min} max={max}
    value={value}
    placeholder={placeholder}
    autoFocus={autoFocus}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-200 p-4 text-xl font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-amber transition-all text-center"
  />
);

// ──────────────────────────────────────────────────────────────────────────────
// Room number generation (pure, same logic as backend)
// ──────────────────────────────────────────────────────────────────────────────
function generateRoomNumbers(
  floors: number,
  roomsPerFloor: number,
  startingNumber: number,
): string[][] {
  const floorBase = Math.floor(startingNumber / 100);
  const roomBase  = startingNumber % 100;
  const result: string[][] = [];
  for (let f = 0; f < floors; f++) {
    const floorNum  = floorBase + f;
    const floorRooms: string[] = [];
    for (let r = 0; r < roomsPerFloor; r++) {
      floorRooms.push(String(floorNum * 100 + roomBase + r));
    }
    result.push(floorRooms);
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// Step indicator dots
// ──────────────────────────────────────────────────────────────────────────────
const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i === current
            ? 'w-6 h-2 bg-warning'
            : i < current
            ? 'w-2 h-2 bg-warning/40'
            : 'w-2 h-2 bg-gray-200'
        }`}
      />
    ))}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main modal component
// ──────────────────────────────────────────────────────────────────────────────
interface BulkRoomModalProps {
  onClose: () => void;
  onSuccess: (result: BulkRoomResult) => void;
}

const TOTAL_STEPS = 3;

const BulkRoomModal: React.FC<BulkRoomModalProps> = ({ onClose, onSuccess }) => {
  // ── Form values ─────────────────────────────────────────────────────────────
  const [step, setStep]                   = useState(0);
  const [floors,         setFloors]        = useState('3');
  const [roomsPerFloor,  setRoomsPerFloor] = useState('4');
  const [startingNumber, setStartingNumber]= useState('101');
  const [bedsPerRoom,    setBedsPerRoom]   = useState('2');

  // ── Submit state ────────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Derived preview ─────────────────────────────────────────────────────────
  const floorNum  = Math.max(1, parseInt(floors)       || 1);
  const rpf       = Math.max(1, parseInt(roomsPerFloor)|| 1);
  const startNum  = Math.max(1, parseInt(startingNumber)||101);
  const bpr       = Math.max(1, parseInt(bedsPerRoom)  || 2);

  const preview = useMemo(
    () => generateRoomNumbers(floorNum, rpf, startNum),
    [floorNum, rpf, startNum],
  );

  const totalRooms = floorNum * rpf;
  const totalBeds  = totalRooms * bpr;

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!floors || floorNum < 1 || floorNum > 20) return 'Floors must be between 1 and 20.';
      if (!roomsPerFloor || rpf < 1 || rpf > 20) return 'Rooms per floor must be between 1 and 20.';
      if (!startingNumber || startNum < 1) return 'Starting number must be at least 1.';
    }
    if (s === 1) {
      if (!bedsPerRoom || bpr < 1 || bpr > 20) return 'Beds per room must be between 1 and 20.';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const payload: BulkRoomCreate = {
      floors: floorNum,
      rooms_per_floor: rpf,
      beds_per_room: bpr,
      starting_number: startNum,
    };
    setLoading(true); setError('');
    try {
      const result = await bulkCreateRooms(payload);
      onSuccess(result);
    } catch (err: any) {
      setError(typeof err.message === 'string' ? err.message : 'Failed to create rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-4 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 pb-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Building2 size={20} className="text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-black leading-tight">Bulk Add Rooms</h2>
                <p className="text-xs text-gray-400 font-medium">
                  Step {step + 1} of {TOTAL_STEPS}
                </p>
              </div>
            </div>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Step dots */}
          <StepDots current={step} total={TOTAL_STEPS} />

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-5 text-sm font-bold border border-red-100 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* ── STEP 0: Property Structure ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-base font-black text-gray-700">Property Structure</p>
                <p className="text-sm text-gray-400 mt-0.5">How many floors and rooms?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Floors">
                  <NumInput
                    value={floors} onChange={setFloors}
                    min={1} max={20} placeholder="3"
                    autoFocus
                  />
                </Field>
                <Field label="Rooms per Floor">
                  <NumInput
                    value={roomsPerFloor} onChange={setRoomsPerFloor}
                    min={1} max={20} placeholder="4"
                  />
                </Field>
              </div>

              <Field label="Starting Room Number" hint="e.g. 101 → generates 101,102… 201,202…">
                <NumInput
                  value={startingNumber} onChange={setStartingNumber}
                  min={1} max={9999} placeholder="101"
                />
              </Field>

              {/* Live mini summary */}
              {floorNum > 0 && rpf > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 text-sm font-bold text-amber-800 text-center">
                  {floorNum} floor{floorNum > 1 ? 's' : ''} × {rpf} room{rpf > 1 ? 's' : ''} = <span className="text-xl font-black">{totalRooms}</span> rooms total
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: Room Config ────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-base font-black text-gray-700">Bed Configuration</p>
                <p className="text-sm text-gray-400 mt-0.5">How many beds per room?</p>
              </div>

              <Field label="Beds per Room" hint="Applied to all rooms (you can add/remove beds later)">
                <NumInput
                  value={bedsPerRoom} onChange={setBedsPerRoom}
                  min={1} max={20} placeholder="2"
                  autoFocus
                />
              </Field>

              {/* Preset chips */}
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2 text-center">Quick select</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBedsPerRoom(String(n))}
                      className={`w-12 h-12 rounded-2xl text-lg font-black border-2 transition-all ${
                        bedsPerRoom === String(n)
                          ? 'bg-warning text-white border-brand-amber shadow-md'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-brand-amber'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm text-gray-500 font-medium">
                  {totalRooms} rooms × {bpr || '?'} beds
                </p>
                <p className="text-3xl font-black text-main-text">{bpr ? totalBeds : '—'}</p>
                <p className="text-xs text-gray-400 font-bold">TOTAL BEDS</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Preview ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-base font-black text-gray-700">Confirm & Create</p>
                <p className="text-sm text-gray-400 mt-0.5">Review your property layout</p>
              </div>

              {/* Summary chips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-amber-700">{totalRooms}</p>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">ROOMS</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-green-700">{totalBeds}</p>
                  <p className="text-xs font-bold text-green-600 mt-0.5">BEDS</p>
                </div>
              </div>

              {/* Floor preview — scrollable if many floors */}
              <div className="max-h-52 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {preview.map((floorRooms, idx) => {
                  const floorLabel = Math.floor(parseInt(startingNumber) / 100) + idx;
                  return (
                    <div key={idx} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-16 flex-shrink-0">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wide">
                          Floor {floorLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {floorRooms.map((num) => (
                          <span
                            key={num}
                            className="bg-gray-100 text-gray-700 text-xs font-black px-2.5 py-1 rounded-lg"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Beds per room note */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
                <BedDouble size={16} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm font-bold text-gray-600">
                  Each room will have <span className="text-main-text">{bpr} bed{bpr > 1 ? 's' : ''}</span> (can be changed later)
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div className={`flex gap-3 mt-7 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
            {step > 0 && (
              <button
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-base tap-target disabled:opacity-50"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={goNext}
                className="flex-1 bg-warning text-white py-4 rounded-2xl font-black text-base tap-target shadow-md flex items-center justify-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-base tap-target shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader inline size="sm" /> Creating {totalRooms} rooms.</>
                ) : (
                  <><CheckCircle size={18} /> Create {totalRooms} Rooms</>
                )}
              </button>
            )}
          </div>

          {/* Step label */}
          <p className="text-center text-xs text-gray-300 font-bold mt-4">
            {step === 0 ? '🏢 Structure' : step === 1 ? '🛏 Beds' : '👁 Preview'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkRoomModal;

