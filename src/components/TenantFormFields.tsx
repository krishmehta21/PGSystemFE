import React from 'react';
import { Calendar, User, Phone, MapPin, IndianRupee, CreditCard, Building2, Car, HeartPulse, FileText } from 'lucide-react';

export interface TenantFormData {
  name: string;
  phone: string;
  rentAmount: string;
  moveInDate: string;
  aadhaar: string;
  pan: string;
  emergencyName: string;
  emergencyPhone: string;
  employer: string;
  hometown: string;
  foodPref: string;
  hasVehicle: boolean;
  vehicle: string;
  depositAmount: string;
  depositDate: string;
  expectedMoveOut: string;
  occupancyType: string;
}

export const initialTenantFormData: TenantFormData = {
  name: '',
  phone: '',
  rentAmount: '',
  moveInDate: '',
  aadhaar: '',
  pan: '',
  emergencyName: '',
  emergencyPhone: '',
  employer: '',
  hometown: '',
  foodPref: 'veg',
  hasVehicle: false,
  vehicle: '',
  depositAmount: '',
  depositDate: '',
  expectedMoveOut: '',
  occupancyType: 'single',
};

interface Props {
  data: TenantFormData;
  onChange: (updates: Partial<TenantFormData>) => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  error?: string;
}

const TenantFormFields: React.FC<Props> = ({ data, onChange, onSubmit, submitLabel = "Save Tenant", submitting = false, error = '' }) => {
  const getFieldState = (field: string) => {
    if (!error) return 'normal';
    if (field === 'name' && error.toLowerCase().includes('name')) return 'error';
    if (field === 'phone' && error.toLowerCase().includes('phone')) return 'error';
    if (field === 'rent' && error.toLowerCase().includes('rent')) return 'error';
    if (field === 'moveInDate' && error.toLowerCase().includes('move-in')) return 'error';
    if (field === 'aadhaar' && error.toLowerCase().includes('aadhaar')) return 'error';
    if (field === 'pan' && error.toLowerCase().includes('pan')) return 'error';
    return 'normal';
  };

  const getInputCls = (fieldState: 'normal' | 'error', hasPrefix: boolean = false) => {
    const base = "w-full p-3 rounded-xl transition-all text-[15px] min-h-[52px] bg-white text-main-text placeholder:text-black/30 outline-none border";
    const stateCls = fieldState === 'error' 
      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
      : "border-gray-200 hover:border-gray-300 focus:border-accent focus:ring-4 focus:ring-accent/10";
    const prefixCls = hasPrefix ? "pl-11" : "";
    return `${base} ${stateCls} ${prefixCls}`;
  };

  const labelCls = "block text-[13px] font-bold text-main-text mb-2";
  const sectionCls = "space-y-5 mb-8";
  const headerCls = "text-[11px] font-bold text-accent uppercase tracking-wider mb-5 flex items-center border-l-2 border-accent pl-3 py-0.5";
  
  const RequiredMark = () => <span className="text-accent ml-1">*</span>;

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onChange({ moveInDate: today });
  };

  return (
    <div className="pb-28 px-1">
      {/* ── Basic Info ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Basic Information</h3>
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Full Name <RequiredMark /></label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="e.g. Rahul Verma" 
                value={data.name} 
                onChange={(e) => onChange({ name: e.target.value })}
                className={getInputCls(getFieldState('name'), true)} 
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone Number <RequiredMark /></label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <div className="absolute left-10 top-1/2 -translate-y-1/2 text-main-text font-medium text-[15px]">+91</div>
              <input 
                type="tel" 
                placeholder="98765 43210" 
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className={getInputCls(getFieldState('phone'), true).replace("pl-11", "pl-[76px]")} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stay Details ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Stay Details</h3>
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-bold text-main-text">Move-in Date <RequiredMark /></label>
              <button 
                type="button" 
                onClick={setToday}
                className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded uppercase tracking-wide hover:bg-accent/20 transition-colors tap-target"
              >
                Today
              </button>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="date" 
                value={data.moveInDate}
                onChange={(e) => onChange({ moveInDate: e.target.value })}
                className={getInputCls(getFieldState('moveInDate'), true)} 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Monthly Rent <RequiredMark /></label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="number" 
                placeholder="8500" 
                value={data.rentAmount}
                onChange={(e) => onChange({ rentAmount: e.target.value })}
                className={getInputCls(getFieldState('rent'), true)} 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Occupancy Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'single', label: 'Single' },
                { id: 'sharing', label: 'Sharing' },
                { id: 'guest', label: 'Guest' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ occupancyType: opt.id })}
                  className={`py-3 rounded-xl text-[13px] font-bold transition-all border tap-target ${
                    data.occupancyType === opt.id 
                      ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent/20' 
                      : 'border-gray-200 bg-white text-main-text hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Security Deposit</label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                <input 
                  type="number" 
                  placeholder="10000" 
                  value={data.depositAmount}
                  onChange={(e) => onChange({ depositAmount: e.target.value })}
                  className={getInputCls('normal', true)} 
                />
              </div>
            </div>
            {data.depositAmount && (
              <div className="animate-fade-up">
                <label className={labelCls}>Received Date</label>
                <input 
                  type="date" 
                  value={data.depositDate}
                  onChange={(e) => onChange({ depositDate: e.target.value })}
                  className={getInputCls('normal', false)} 
                />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Expected Move-out <span className="text-black/40 font-normal">(Optional)</span></label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="date" 
                value={data.expectedMoveOut}
                onChange={(e) => onChange({ expectedMoveOut: e.target.value })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Identity ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Identity & Background</h3>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Aadhaar Last 4</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                <input 
                  type="text" 
                  placeholder="4021" 
                  value={data.aadhaar}
                  onChange={(e) => onChange({ aadhaar: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className={getInputCls(getFieldState('aadhaar'), true)} 
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>PAN Number</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={16} />
                <input 
                  type="text" 
                  placeholder="ABCDE1234F" 
                  value={data.pan}
                  onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
                  className={getInputCls(getFieldState('pan'), true)} 
                  maxLength={10}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Employer / College</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="e.g. TCS, Infosys, VIT" 
                value={data.employer}
                onChange={(e) => onChange({ employer: e.target.value })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Hometown</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="e.g. Pune, Maharashtra" 
                value={data.hometown}
                onChange={(e) => onChange({ hometown: e.target.value })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Food Preference</label>
            <div className="flex gap-2">
              {[
                { id: 'veg', label: 'Veg' },
                { id: 'non_veg', label: 'Non-Veg' },
                { id: 'any', label: 'Any' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ foodPref: opt.id })}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all border tap-target ${
                    data.foodPref === opt.id 
                      ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent/20' 
                      : 'border-gray-200 bg-white text-main-text hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Emergency Contact ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Emergency Contact</h3>
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Contact Name</label>
            <div className="relative">
              <HeartPulse className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="e.g. Ramesh Verma (Father)" 
                value={data.emergencyName}
                onChange={(e) => onChange({ emergencyName: e.target.value })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Contact Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="tel" 
                placeholder="10-digit number" 
                value={data.emergencyPhone}
                onChange={(e) => onChange({ emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Vehicle Info ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Vehicle Information</h3>
        <label className="flex items-center gap-3 mb-5 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-accent/50 transition-colors tap-target">
          <input 
            type="checkbox" 
            checked={data.hasVehicle}
            onChange={(e) => onChange({ hasVehicle: e.target.checked })}
            className="w-5 h-5 rounded accent-accent"
          />
          <span className="text-[15px] font-bold text-main-text">Tenant has a vehicle</span>
        </label>
        {data.hasVehicle && (
          <div className="animate-fade-up">
            <label className={labelCls}>Registration Number</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="e.g. MH 12 AB 1234" 
                value={data.vehicle}
                onChange={(e) => onChange({ vehicle: e.target.value.toUpperCase() })}
                className={getInputCls('normal', true)} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-[500px] mx-auto">
          {error && (
            <div className="mb-3 text-red-500 text-[13px] font-bold flex items-center justify-center animate-fade-up">
              {error}
            </div>
          )}
          <button 
            onClick={onSubmit}
            disabled={submitting}
            className="w-full bg-main-text text-white h-14 rounded-xl font-bold text-[15px] tap-target disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_8px_16px_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantFormFields;
