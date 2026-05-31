import React from 'react';

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
}

const TenantFormFields: React.FC<Props> = ({ data, onChange, onSubmit, submitLabel = "Save Tenant", submitting = false }) => {
  const inputCls = "w-full border border-main-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm min-h-[48px]";
  const labelCls = "block text-sm font-semibold text-main-text mb-1.5";
  const sectionCls = "space-y-4 mb-6";
  const headerCls = "text-sm font-bold text-black/40 uppercase tracking-widest mb-4 border-b border-main-border pb-2";

  return (
    <div className="pb-24">
      {/* ── Basic Info ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Basic Information</h3>
        <div>
          <label className={labelCls}>Full Name</label>
          <input 
            type="text" 
            placeholder="e.g. Rahul Verma" 
            value={data.name} 
            onChange={(e) => onChange({ name: e.target.value })}
            className={inputCls} 
            autoFocus
          />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input 
            type="tel" 
            placeholder="10-digit mobile number" 
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            className={inputCls} 
          />
        </div>
      </div>

      {/* ── Stay Details ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Stay Details</h3>
        <div>
          <label className={labelCls}>Move-in Date</label>
          <input 
            type="date" 
            value={data.moveInDate}
            onChange={(e) => onChange({ moveInDate: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Expected Move-out (Optional)</label>
          <input 
            type="date" 
            value={data.expectedMoveOut}
            onChange={(e) => onChange({ expectedMoveOut: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Monthly Rent (₹)</label>
          <input 
            type="number" 
            placeholder="8500" 
            value={data.rentAmount}
            onChange={(e) => onChange({ rentAmount: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Security Deposit (₹)</label>
          <input 
            type="number" 
            placeholder="e.g. 10000" 
            value={data.depositAmount}
            onChange={(e) => onChange({ depositAmount: e.target.value })}
            className={inputCls} 
          />
        </div>
        {data.depositAmount && (
          <div>
            <label className={labelCls}>Deposit Received Date</label>
            <input 
              type="date" 
              value={data.depositDate}
              onChange={(e) => onChange({ depositDate: e.target.value })}
              className={inputCls} 
            />
          </div>
        )}
        <div>
          <label className={labelCls}>Occupancy Type</label>
          <select 
            value={data.occupancyType}
            onChange={(e) => onChange({ occupancyType: e.target.value })}
            className={`${inputCls} bg-white`}
          >
            <option value="single">Single (Standard)</option>
            <option value="sharing">Sharing</option>
            <option value="guest">Guest (Temporary)</option>
          </select>
        </div>
      </div>

      {/* ── Identity ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Identity & Background</h3>
        <div>
          <label className={labelCls}>Aadhaar Last 4 Digits</label>
          <input 
            type="text" 
            placeholder="e.g. 4021" 
            value={data.aadhaar}
            onChange={(e) => onChange({ aadhaar: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>PAN Number</label>
          <input 
            type="text" 
            placeholder="e.g. ABCDE1234F" 
            value={data.pan}
            onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
            className={inputCls} 
            maxLength={10}
          />
        </div>
        <div>
          <label className={labelCls}>Employer or College</label>
          <input 
            type="text" 
            placeholder="e.g. TCS, Infosys, VIT" 
            value={data.employer}
            onChange={(e) => onChange({ employer: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Hometown</label>
          <input 
            type="text" 
            placeholder="e.g. Pune, Maharashtra" 
            value={data.hometown}
            onChange={(e) => onChange({ hometown: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Food Preference</label>
          <select 
            value={data.foodPref}
            onChange={(e) => onChange({ foodPref: e.target.value })}
            className={`${inputCls} bg-white`}
          >
            <option value="veg">Veg</option>
            <option value="non_veg">Non-Veg</option>
            <option value="any">Any</option>
          </select>
        </div>
      </div>

      {/* ── Emergency Contact ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Emergency Contact</h3>
        <div>
          <label className={labelCls}>Contact Name</label>
          <input 
            type="text" 
            placeholder="e.g. Ramesh Verma (Father)" 
            value={data.emergencyName}
            onChange={(e) => onChange({ emergencyName: e.target.value })}
            className={inputCls} 
          />
        </div>
        <div>
          <label className={labelCls}>Contact Phone</label>
          <input 
            type="tel" 
            placeholder="10-digit number" 
            value={data.emergencyPhone}
            onChange={(e) => onChange({ emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            className={inputCls} 
          />
        </div>
      </div>

      {/* ── Vehicle Info ── */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Vehicle Information</h3>
        <label className="flex items-center gap-3 mb-4 tap-target cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.hasVehicle}
            onChange={(e) => onChange({ hasVehicle: e.target.checked })}
            className="w-5 h-5 rounded accent-main-text"
          />
          <span className="text-sm font-semibold text-main-text">Has a vehicle?</span>
        </label>
        {data.hasVehicle && (
          <div>
            <label className={labelCls}>Vehicle Registration Number</label>
            <input 
              type="text" 
              placeholder="e.g. MH 12 AB 1234" 
              value={data.vehicle}
              onChange={(e) => onChange({ vehicle: e.target.value.toUpperCase() })}
              className={inputCls} 
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-main-border z-10">
        <button 
          onClick={onSubmit}
          disabled={submitting}
          className="w-full bg-main-text text-white h-12 rounded-lg font-semibold text-sm tap-target disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-accent transition-colors shadow-lg"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );
};

export default TenantFormFields;
