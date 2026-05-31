import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertCircle, AlertTriangle, Building2, BedDouble, Users, Wrench, Settings, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getMyPG, getTenants, getMaintenanceRequests } from '../api/endpoints';
import type { DashboardStats, Tenant, MaintenanceRequest } from '../api/types';
import { getCache, setCache } from '../utils/cache';
import Loader from '../components/Loader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [pg, setPg] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatINR = (val: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadData = async (force = false) => {
    if (!force) {
      const cached = getCache('dashboard');
      const cachedPg = getCache('my_pg');
      const cachedTenants = getCache('tenants_all');
      if (cached && cachedPg && cachedTenants) {
        setData(cached);
        setPg(cachedPg);
        setTenants(cachedTenants);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(false);
    try {
      const [stats, pgDetails, tenantsList, maintList] = await Promise.all([
        getDashboard(),
        getMyPG(),
        getTenants(),
        getMaintenanceRequests()
      ]);
      setData(stats);
      setPg(pgDetails);
      setTenants(tenantsList);
      setMaintenance(maintList);
      
      setCache('dashboard', stats);
      setCache('my_pg', pgDetails);
      setCache('tenants_all', tenantsList);
      setCache('maintenance_all', maintList);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate lease renewals (10+ months)
  const tenMonthsAgo = new Date();
  tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);
  
  const renewals = tenants.filter(
    t => t.is_active !== false && new Date(t.move_in_date) < tenMonthsAgo
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="font-serif text-[22px] text-main-text">
          {getTimeGreeting()}
        </h1>
        {loading ? (
          <div className="skeleton-loader h-4 w-56 mt-2" />
        ) : (
          <p className="text-black/60 text-[14px] mt-1">
            {data?.pg_name || "My PG"} · {pg?.address || "Address not set"}
          </p>
        )}
      </header>

      {error ? (
        <button onClick={() => loadData(true)} className="w-full text-left card p-5 mb-8 flex items-center gap-3 border-red-200 hover:border-red-300 transition-colors tap-target">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-500">Failed to load dashboard. Tap to retry.</p>
        </button>
      ) : loading ? (
        <div className="py-12">
          <Loader size="md" />
        </div>
      ) : data ? (
        data.total_beds === 0 ? (
          <div className="card p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-main-border mb-8 animate-fade-up">
            <div className="w-12 h-12 bg-main-bg rounded-full flex items-center justify-center text-accent mb-3 border border-main-border shadow-sm">
              <Building2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-main-text mb-1">No rooms found</h3>
            <p className="text-xs text-black/60 mb-5">Add your first room to start tracking occupancy</p>
            <button 
              onClick={() => navigate('/rooms')}
              className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 mx-auto shadow-sm"
            >
              <span>Go to Rooms</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {/* Renewals Warning Banner */}
            {renewals.length > 0 && (
              <button
                onClick={() => navigate('/tenants?highlight_renewals=true')}
                className="w-full text-left bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 flex items-start gap-3 shadow-sm hover:border-amber-300 active:scale-95 transition-all cursor-pointer"
              >
                <div className="p-1.5 bg-amber-100 rounded-full mt-0.5 text-amber-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Lease Renewals Due</h3>
                  <p className="text-xs mt-1 font-medium leading-relaxed">
                    {renewals.length} tenant{renewals.length !== 1 ? 's' : ''} have been staying for over 10 months. It may be time to review their contracts or initiate rent increments. Tap to view.
                  </p>
                </div>
              </button>
            )}

            {/* Rent Collection Progress */}
            <button
              onClick={() => navigate('/tenants?filter=unpaid')}
              className="w-full text-left card p-5 hover:border-black/15 hover:shadow-sm active:scale-95 transition-all cursor-pointer block"
            >
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-black/60 mb-1">Rent Collection</h3>
                  <div className="flex items-center gap-1 font-serif text-2xl text-main-text">
                    <span>{formatINR(data.total_rent_collected)}</span>
                    <span className="text-sm font-sans text-black/40 ml-1">/ {formatINR(data.total_rent_expected)}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  {data.total_rent_expected > 0 
                    ? Math.round((data.total_rent_collected / data.total_rent_expected) * 100) 
                    : 0}%
                </div>
              </div>
              
              <div className="h-3 w-full bg-main-bg rounded-full overflow-hidden border border-main-border">
                <div 
                  className="h-full bg-accent transition-all duration-1000 ease-out" 
                  style={{ width: `${data.total_rent_expected > 0 ? (data.total_rent_collected / data.total_rent_expected) * 100 : 0}%` }}
                />
              </div>
            </button>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value={data.occupied_beds} label="Occupied Beds" onClick={() => navigate('/tenants')} />
              <StatCard value={data.empty_beds} label="Vacant Beds" highlight={data.empty_beds > 0} onClick={() => navigate('/rooms?filter=vacant')} />
              <StatCard value={`${data.vacancy_rate}%`} label="Vacancy Rate" />
              <StatCard value={data.beds_vacant_gt30_days} label="Vacant >30 Days" warning={data.beds_vacant_gt30_days > 0} onClick={() => navigate('/rooms?filter=vacant&highlight_old=true')} />
            </div>
          </div>
        )
      ) : null}

      <hr className="border-t border-main-border mb-8" />

      <h2 className="text-black/60 text-[11px] font-semibold tracking-widest uppercase mb-3">QUICK ADD</h2>
      <button 
        onClick={() => navigate('/tenants?action=add')}
        className="w-full bg-[#0F0F0F] rounded-2xl border-l-4 border-accent px-5 py-4 flex items-center justify-between text-left active:scale-95 transition-all duration-150 shadow-sm mb-8"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">Add New Tenant</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Find a room and assign a bed</p>
          </div>
        </div>
        <ArrowRight size={20} className="text-accent flex-shrink-0 ml-3" />
      </button>

      <h2 className="font-serif text-[18px] text-main-text mb-4">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/rooms')}
          className="card aspect-square p-3 flex flex-col items-center justify-center text-center hover:border-black/15 hover:shadow-sm active:scale-95 transition-all group tap-target"
        >
          <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
            <BedDouble size={20} />
          </div>
          <span className="text-xs font-semibold text-main-text">Rooms</span>
        </button>
        <button 
          onClick={() => navigate('/tenants')}
          className="card aspect-square p-3 flex flex-col items-center justify-center text-center hover:border-black/15 hover:shadow-sm active:scale-95 transition-all group tap-target"
        >
          <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <span className="text-xs font-semibold text-main-text">Tenants</span>
        </button>
        <button 
          onClick={() => navigate('/maintenance')}
          className="card aspect-square p-3 flex flex-col items-center justify-center text-center hover:border-black/15 hover:shadow-sm active:scale-95 transition-all group tap-target relative"
        >
          {maintenance.filter(m => m.status === 'open').length > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {maintenance.filter(m => m.status === 'open').length}
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
            <Wrench size={20} />
          </div>
          <span className="text-xs font-semibold text-main-text">Issues</span>
        </button>
        <button 
          onClick={() => navigate('/settings')}
          className="card aspect-square p-3 flex flex-col items-center justify-center text-center hover:border-black/15 hover:shadow-sm active:scale-95 transition-all group tap-target"
        >
          <div className="w-10 h-10 rounded-full bg-main-bg flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
            <Settings size={20} />
          </div>
          <span className="text-xs font-semibold text-main-text">Settings</span>
        </button>
      </div>
    </div>
  );
};

interface StatCardProps {
  value: number | string;
  label: string;
  highlight?: boolean;
  warning?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, highlight, warning, onClick }) => {
  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={`card p-5 flex flex-col justify-center text-left transition-all ${
        onClick ? 'cursor-pointer hover:border-black/15 hover:shadow-sm active:scale-95' : ''
      } ${warning ? 'border-amber-200 bg-amber-50/30' : ''}`}
    >
      <span className={`font-serif text-[28px] leading-tight ${warning ? 'text-amber-600' : highlight ? 'text-accent' : 'text-main-text'}`}>
        {value}
      </span>
      <span className="text-black/60 text-[12px] font-semibold tracking-wide uppercase mt-1">{label}</span>
    </button>
  );
};

export default Dashboard;
