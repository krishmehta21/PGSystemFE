import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee, Calendar, FileText, Activity } from 'lucide-react';
import type { PG, DashboardStats } from '../api/types';
import { updatePGSubscription, getDashboardForAdmin } from '../api/endpoints';
import Loader from './Loader';

interface PGDetailSheetProps {
  pg: PG | null;
  onClose: () => void;
  onUpdate: () => void;
}

const PGDetailSheet: React.FC<PGDetailSheetProps> = ({ pg, onClose, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Editable fields
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (pg) {
      setMonthlyPrice(pg.monthly_price ? pg.monthly_price.toString() : '');
      setStartDate(pg.subscription_start || '');
      setEndDate(pg.subscription_end || '');
      setNotes(pg.subscription_notes || '');

      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const res = await getDashboardForAdmin(pg.id);
          setStats(res);
        } catch (err) {
          console.error("Failed to fetch dashboard stats", err);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [pg]);

  if (!pg) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePGSubscription(pg.id, {
        monthly_price: monthlyPrice ? parseFloat(monthlyPrice) : 0,
        subscription_start: startDate || undefined,
        subscription_end: endDate || undefined,
        subscription_notes: notes || undefined
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to save subscription details", err);
      alert("Failed to save subscription details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideLeft_250ms_cubic-bezier(0.4,0,0.2,1)] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pg.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{pg.address}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-8">
          
          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                pg.subscription_status === 'suspended' ? 'bg-red-100 text-red-700' :
                pg.subscription_status === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {pg.subscription_status}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Activation Key</p>
              <p className="font-mono text-sm font-bold text-gray-900">{pg.activation_code}</p>
            </div>
          </div>

          {/* Subscription Editing */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <IndianRupee size={16} className="text-gray-400" />
              Subscription Terms
            </h3>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monthly Price (₹)</label>
              <input 
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="e.g. 499"
                className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 pl-9 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-200 pl-9 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400" />
                Notes
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about pricing, agreements, etc."
                rows={3}
                className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Stats section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Activity size={16} className="text-gray-400" />
              Live Activity
            </h3>
            
            {statsLoading ? (
              <div className="py-6 flex justify-center"><Loader size="sm" /></div>
            ) : stats ? (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Total Beds</p>
                  <p className="font-bold text-gray-900">{stats.total_beds}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Occupied Beds</p>
                  <p className="font-bold text-green-600">{stats.occupied_beds}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Total Tenants</p>
                  <p className="font-bold text-gray-900">{stats.occupied_beds}</p> {/* Assuming 1 tenant per occupied bed */}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Vacancy Rate</p>
                  <p className="font-bold text-amber-600">{stats.vacancy_rate.toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No activity data available.</div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-70"
          >
            {saving ? <Loader inline size="sm" /> : <Save size={18} />}
            Save Subscription Details
          </button>
        </div>

      </div>
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PGDetailSheet;
