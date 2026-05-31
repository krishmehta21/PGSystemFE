import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Building2, ChevronRight } from 'lucide-react';
import { getRooms, getBeds, createTenant } from '../api/endpoints';
import type { Room, Bed, TenantCreate } from '../api/types';
import TenantFormFields, { initialTenantFormData, type TenantFormData } from './TenantFormFields';
import Loader from './Loader';

interface Props {
  onClose: () => void;
  onSuccess: (tenantName: string) => void;
  preselectedRoom?: Room;
  preselectedBed?: Bed;
}

const AddTenantSheet: React.FC<Props> = ({ onClose, onSuccess, preselectedRoom, preselectedBed }) => {
  const [step, setStep] = useState<1 | 2>(preselectedBed ? 2 : 1);
  const [rooms, setRooms] = useState<(Room & { beds: Bed[] })[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'any' | '1' | '2' | '3' | '4+'>('any');

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(preselectedRoom || null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(preselectedBed || null);

  const [formData, setFormData] = useState<TenantFormData>(initialTenantFormData);

  useEffect(() => {
    if (step === 1 && !preselectedBed) {
      loadRooms();
    }
  }, [step, preselectedBed]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const [roomsData, bedsData] = await Promise.all([getRooms(), getBeds()]);
      const roomsWithBeds = roomsData.map(room => ({
        ...room,
        beds: bedsData.filter(b => b.room_id === room.id)
      }));
      setRooms(roomsWithBeds);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleBedSelect = (room: Room, bed: Bed) => {
    setSelectedRoom(room);
    setSelectedBed(bed);
    setStep(2);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedBed || !selectedRoom) return;
    
    // Validation
    if (!formData.name.trim()) { setError('Name is required.'); return; }
    if (formData.phone.length !== 10) { setError('Enter a valid 10-digit phone number.'); return; }
    const rent = Number(formData.rentAmount);
    if (isNaN(rent) || rent <= 0) { setError('Enter a valid rent amount.'); return; }
    if (!formData.moveInDate) { setError('Move-in date is required.'); return; }
    
    if (formData.aadhaar && formData.aadhaar.length !== 4) { setError('Aadhaar must be exactly 4 digits.'); return; }
    if (formData.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.pan)) { setError('PAN must match format ABCDE1234F.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const payload: TenantCreate = {
        name: formData.name.trim(),
        phone: formData.phone,
        rent_amount: rent,
        bed_id: selectedBed.id,
        move_in_date: formData.moveInDate,
        rent_status: 'unpaid',
        aadhaar_last4: formData.aadhaar || undefined,
        pan_number: formData.pan || undefined,
        emergency_contact_name: formData.emergencyName.trim() || undefined,
        emergency_contact_phone: formData.emergencyPhone || undefined,
        employer_or_college: formData.employer.trim() || undefined,
        hometown: formData.hometown.trim() || undefined,
        food_preference: formData.foodPref as 'veg' | 'non_veg' | 'both',
        vehicle_registration: formData.hasVehicle ? formData.vehicle.trim() : undefined,
        security_deposit_amount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        security_deposit_date: formData.depositDate || undefined,
        expected_move_out_date: formData.expectedMoveOut || undefined,
        occupancy_type: formData.occupancyType as 'single' | 'double' | 'triple',
      };

      await createTenant(payload);
      onSuccess(formData.name.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to assign tenant.');
      // Auto-scroll to top to show error if we were still using top-level error box, but we're moving it down.
      // We'll keep this scroll to bottom to show the error near the button
      document.getElementById('add-tenant-scroll-container')?.scrollTo({ top: document.getElementById('add-tenant-scroll-container')?.scrollHeight, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter rooms with vacant beds
  const roomsWithVacancy = rooms.map(room => ({
    ...room,
    vacantBeds: room.beds?.filter((b: Bed) => !b.is_occupied) || []
  })).filter(room => room.vacantBeds.length > 0);

  const filteredRooms = roomsWithVacancy.filter(room => {
    if (filter === 'any') return true;
    const total = room.total_beds;
    if (filter === '1') return total === 1;
    if (filter === '2') return total === 2;
    if (filter === '3') return total === 3;
    if (filter === '4+') return total >= 4;
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative bg-white w-full max-w-[500px] mx-auto h-[95vh] rounded-t-3xl shadow-2xl flex flex-col animate-fade-up">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-center relative border-b border-gray-100 shrink-0 bg-white rounded-t-3xl px-4">
          {step === 2 && !preselectedBed ? (
            <button aria-label="Go back" onClick={() => setStep(1)} className="absolute left-4 p-2 -ml-2 transition-colors active:bg-gray-100 rounded-md tap-target">
              <ChevronLeft size={24} className="text-main-text" />
            </button>
          ) : null}
          
          <h2 className="text-[17px] font-bold text-main-text">
            {step === 1 ? 'Select Room' : 'Add Tenant'}
          </h2>
          
          <button aria-label="Close" onClick={() => !submitting && onClose()} className="absolute right-4 p-2 -mr-2 text-black/40 hover:text-main-text transition-colors rounded-full tap-target">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div id="add-tenant-scroll-container" className="flex-1 overflow-y-auto">
          {error && step === 1 && (
            <div className="m-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-200">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="p-4 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {(['any', '1', '2', '3', '4+'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 px-5 py-2 rounded-xl text-[13px] font-bold transition-all tap-target ${
                      filter === f 
                        ? 'bg-main-text text-white shadow-md' 
                        : 'bg-white text-main-text border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {f === 'any' ? 'Any' : `${f} Bed${f !== '1' ? 's' : ''}`}
                  </button>
                ))}
              </div>

              {loadingRooms ? (
                <div className="py-12"><Loader size="md" /></div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
                  <Building2 size={32} className="mx-auto text-black/20 mb-3" />
                  <p className="text-[15px] font-bold text-main-text">No vacant rooms found</p>
                  <p className="text-[13px] text-black/40 mt-1">Try a different filter or add more beds.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-main-text text-[15px]">Room {room.room_number}</h3>
                        <span className="text-[11px] font-bold text-black/40 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-md">{room.total_beds} Sharing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {room.vacantBeds.map((bed: Bed) => (
                          <button
                            key={bed.id}
                            onClick={() => handleBedSelect(room, bed)}
                            className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50 transition-colors tap-target text-left group"
                          >
                            <span className="text-[13px] font-bold truncate pr-2">{bed.bed_label || 'Bed'}</span>
                            <ChevronRight size={16} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedRoom && selectedBed && (
            <div className="p-4">
              <div className="bg-emerald-50 text-emerald-800 rounded-xl p-3.5 mb-6 text-[13px] font-bold border border-emerald-200 shadow-sm text-center flex items-center justify-center gap-2">
                <Building2 size={16} className="opacity-70" />
                Assigning to Room {selectedRoom.room_number} · {selectedBed.bed_label || 'Bed'}
              </div>

              <TenantFormFields 
                data={formData}
                onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                onSubmit={handleSubmit}
                submitting={submitting}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddTenantSheet;
