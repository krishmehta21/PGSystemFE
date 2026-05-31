import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTenants, getUnpaidTenants } from '../api/endpoints';
import type { Tenant } from '../api/types';
import { getCache, setCache, invalidateCache } from '../utils/cache';
import Loader from '../components/Loader';
import AddTenantSheet from '../components/AddTenantSheet';

const Tenants: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'renewals'>('all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [highlightRenewals, setHighlightRenewals] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [cameFromDashboard, setCameFromDashboard] = useState(false);
  const [collapsedRooms, setCollapsedRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('collapsedRooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('collapsedRooms', JSON.stringify(collapsedRooms));
  }, [collapsedRooms]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('filter') === 'unpaid') {
      setFilter('unpaid');
    } else if (searchParams.get('filter') === 'renewals') {
      setFilter('renewals');
    }
    if (searchParams.get('highlight_renewals') === 'true') {
      setHighlightRenewals(true);
    }
    
    const wasActionAdd = searchParams.get('action') === 'add';
    const wasFromDashboard = searchParams.get('from') === 'dashboard';
    
    if (wasFromDashboard) {
      setCameFromDashboard(true);
    }
    if (wasActionAdd) {
      setShowAddTenant(true);
    }
    
    if (wasActionAdd || wasFromDashboard) {
      const cleanParams = new URLSearchParams(location.search);
      cleanParams.delete('action');
      cleanParams.delete('from');
      const newSearch = cleanParams.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState(null, '', newPath);
    }
  }, [location.search]);

  // Calculate 10 months threshold
  const tenMonthsAgo = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 10);
    return d;
  }, []);

  const isRenewalDue = React.useCallback((t: Tenant) => {
    return t.is_active !== false && new Date(t.move_in_date) < tenMonthsAgo;
  }, [tenMonthsAgo]);

  const handleExportCSV = async () => {
    const pgId = localStorage.getItem("pg_context_id");
    if (!pgId) {
      alert("No property context found. Please log in again.");
      return;
    }
    const token = localStorage.getItem("pg_token");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    
    setExporting(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/pgs/${pgId}/export/rent-ledger`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-PG-ID": pgId
        }
      });
      if (!response.ok) throw new Error("Failed to download CSV");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rent_ledger_${pgId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error exporting CSV ledger.");
    } finally {
      setExporting(false);
    }
  };

  const handleCloseAddTenant = (isSuccess = false, name?: string) => {
    setShowAddTenant(false);
    if (isSuccess && name) {
      invalidateCache('tenants_all');
      invalidateCache('dashboard');
      invalidateCache('rooms');
      loadTenants(true);
      alert(`${name} assigned successfully!`);
    }
    if (cameFromDashboard) {
      navigate('/dashboard');
    }
  };

  const loadTenants = async (force = false) => {
    const cacheKey = `tenants_${filter}`;
    if (!force) {
      const cached = getCache(cacheKey);
      if (cached) {
        setTenants(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(false);
    try {
      let data = filter === 'unpaid' 
        ? await getUnpaidTenants() 
        : await getTenants();
      
      if (filter === 'renewals') {
        const d = new Date();
        d.setMonth(d.getMonth() - 10);
        data = data.filter(t => t.is_active !== false && new Date(t.move_in_date) < d);
      }
      setTenants(data);
      setCache(cacheKey, data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [filter]);

  // Auto-scroll to the first highlighted renewal tenant when loaded
  useEffect(() => {
    if (highlightRenewals && tenants.length > 0) {
      const firstRenewal = tenants.find(isRenewalDue);
      if (firstRenewal) {
        setTimeout(() => {
          const el = document.getElementById(`tenant-${firstRenewal.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  }, [highlightRenewals, tenants, isRenewalDue]);

  // Group tenants by room
  const groupedTenants = React.useMemo(() => {
    const groups = tenants.reduce((acc, tenant) => {
      const room = tenant.room_number || 'Unassigned';
      if (!acc[room]) acc[room] = [];
      acc[room].push(tenant);
      return acc;
    }, {} as Record<string, Tenant[]>);
    
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    }).map(room => ({ room, tenants: groups[room] }));
  }, [tenants]);

  // No animation on load, state handles it

  return (
    <div className="p-5">
      <header className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-1">
            <button aria-label="Go back" onClick={() => navigate(-1)} className="p-2 -ml-2 transition-colors active:bg-gray-100 rounded-md tap-target flex-shrink-0">
              <ChevronLeft size={24} className="text-main-text" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-main-text">Tenants</h1>
              <span className="bg-main-bg text-black/60 px-2.5 py-0.5 rounded-md text-sm font-semibold border border-main-border">
                {tenants.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="bg-white border border-main-border text-black/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:border-gray-300 transition-colors tap-target flex items-center gap-1 disabled:opacity-50 shadow-sm flex-shrink-0"
            >
              {exporting ? "..." : "📥 CSV"}
            </button>
            <button
              onClick={() => setShowAddTenant(true)}
              className="bg-main-text text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 tap-target hover:bg-accent transition-colors shadow-sm flex-1 sm:flex-none text-center"
            >
              + Add Tenant
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          <FilterPill 
            label="All" 
            active={filter === 'all'} 
            onClick={() => setFilter('all')} 
          />
          <FilterPill 
            label="Unpaid Only" 
            active={filter === 'unpaid'} 
            onClick={() => setFilter('unpaid')} 
          />
          <FilterPill 
            label="Renewals Due" 
            active={filter === 'renewals'} 
            onClick={() => setFilter('renewals')} 
          />
        </div>
      </header>

      {error && (
        <button onClick={() => loadTenants(true)} className="w-full text-left card p-4 mb-5 flex items-center gap-3 border-red-200 tap-target">
          <p className="text-sm font-medium text-red-600">Failed to load tenants. Tap to retry.</p>
        </button>
      )}

      {loading ? (
        <div className="py-12">
          <Loader size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTenants.map(({ room, tenants: roomTenants }) => {
            const isCollapsed = collapsedRooms.includes(room);
            return (
              <div key={room} className="mb-4">
                <button 
                  onClick={() => setCollapsedRooms(prev => 
                    prev.includes(room) ? prev.filter(r => r !== room) : [...prev, room]
                  )}
                  className="w-full flex items-center justify-between py-2 mb-2 tap-target"
                >
                  <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest px-1">
                    {room === 'Unassigned' ? 'Unassigned' : `Room ${room}`} 
                    <span className="normal-case ml-2 font-semibold">· {roomTenants.length} tenant{roomTenants.length !== 1 ? 's' : ''}</span>
                  </h2>
                  {isCollapsed ? <ChevronRight size={16} className="text-black/40" /> : <ChevronDown size={16} className="text-black/40" />}
                </button>
                <div className={isCollapsed ? 'hidden' : 'space-y-2'}>
                  {roomTenants.map(tenant => {
                    const renewalDue = highlightRenewals && isRenewalDue(tenant);
                    return (
                      <button 
                        key={tenant.id}
                        id={`tenant-${tenant.id}`}
                        onClick={() => navigate(`/tenant/${tenant.id}`)}
                        className={`card w-full flex items-center gap-3 px-4 py-3 min-h-[56px] hover:border-gray-300 active:bg-gray-50/50 transition-all tap-target text-left group ${
                          renewalDue 
                            ? 'border-amber-300 bg-amber-50/20 ring-2 ring-amber-300 ring-offset-1 scale-[1.01]' 
                            : ''
                        }`}
                      >
                        <div className="shrink-0">
                          <Avatar 
                            initials={tenant.name.split(' ').map(n => n[0]).join('')} 
                            isPaid={tenant.rent_status === 'paid'} 
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-main-text flex items-center gap-2 truncate">
                            {tenant.name}
                            {renewalDue && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                ⚠️ Renewal Due
                              </span>
                            )}
                          </h3>
                          <p className="text-black/60 text-xs mt-0.5 font-medium truncate">Room {tenant.room_number || 'N/A'} · {tenant.bed_label || 'N/A'}</p>
                        </div>
                        
                        <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          tenant.rent_status === 'paid' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {tenant.rent_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                        
                        <ChevronRight size={16} className="text-black/40 shrink-0 group-hover:text-black/60 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!loading && tenants.length === 0 && !error && (
            <div className="card p-8 flex flex-col items-center justify-center text-center gap-3 my-4">
              <div className="w-12 h-12 bg-main-bg rounded-lg flex items-center justify-center text-black/40 border border-main-border">
                <ChevronRight size={24} />
              </div>
              <h2 className="text-base font-bold text-main-text">
                {filter === 'unpaid' ? "All Caught Up!" : "No Tenants Found"}
              </h2>
              <p className="text-black/60 text-sm leading-relaxed max-w-[260px]">
                {filter === 'unpaid' 
                  ? "Great job! All your tenants have paid their rent for the month." 
                  : "You haven't assigned any tenants to beds yet. Go to Rooms to add one."}
              </p>
              {filter !== 'unpaid' && (
                <button 
                  onClick={() => navigate('/rooms')}
                  className="mt-2 bg-main-text text-white text-sm px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center tap-target hover:bg-accent transition-colors"
                >
                  Go to Rooms
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {showAddTenant && (
        <AddTenantSheet
          onClose={() => handleCloseAddTenant(false)}
          onSuccess={(name) => {
            handleCloseAddTenant(true, name);
          }}
        />
      )}
    </div>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors tap-target ${
      active 
        ? 'bg-main-text border-main-text text-white' 
        : 'bg-white border-main-border text-black/60 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const Avatar: React.FC<{ initials: string; isPaid: boolean }> = ({ initials, isPaid }) => (
  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 ${
    isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
  }`}>
    {initials.slice(0, 2).toUpperCase()}
  </div>
);

export default Tenants;

