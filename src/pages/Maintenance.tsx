import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceStatus, getTenants } from '../api/endpoints';
import Loader from '../components/Loader';
import type { MaintenanceRequest, MaintenanceStatus, Tenant } from '../api/types';
import { Plus, Wrench, X, Clock, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Maintenance: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MaintenanceStatus>('open');
  const [showAddSheet, setShowAddSheet] = useState(false);
  
  // Form state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, tenantData] = await Promise.all([
        getMaintenanceRequests(),
        getTenants()
      ]);
      setRequests(reqData);
      setTenants(tenantData.filter(t => t.is_active !== false)); // Only active tenants
    } catch (err: any) {
      console.error(err);
      setError('Failed to load maintenance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !title.trim() || !description.trim()) {
      setError("Please fill all fields");
      return;
    }
    setSubmitting(true);
    setError('');
    
    try {
      await createMaintenanceRequest({
        tenant_id: selectedTenantId,
        title: title.trim(),
        description: description.trim()
      });
      await loadData();
      setShowAddSheet(false);
      setSelectedTenantId('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MaintenanceStatus) => {
    setUpdatingTicketId(id);
    try {
      // Optimistic update
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      await updateMaintenanceStatus(id, newStatus);
    } catch (err) {
      console.error(err);
      await loadData(); // Revert on failure
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const filteredRequests = requests.filter(req => req.status === filter);

  return (
    <div className="p-5 pb-24">
      <header className="mb-6">
        <div className="h-16 flex items-center justify-center relative mb-5">
          <button aria-label="Go back" onClick={() => navigate(-1)} className="absolute left-0 p-2 -ml-2 transition-colors active:bg-gray-100 rounded-md tap-target">
            <ChevronLeft size={24} className="text-main-text" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-main-text">Maintenance</h1>
          </div>
          <button aria-label="Add ticket"
            onClick={() => setShowAddSheet(true)}
            className="absolute right-0 w-8 h-8 bg-main-text text-white rounded-full flex items-center justify-center tap-target shadow-md hover:bg-accent hover:text-main-text transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill label="Open" active={filter === 'open'} onClick={() => setFilter('open')} count={requests.filter(r => r.status === 'open').length} />
          <FilterPill label="In Progress" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} count={requests.filter(r => r.status === 'in_progress').length} />
          <FilterPill label="Resolved" active={filter === 'resolved'} onClick={() => setFilter('resolved')} count={requests.filter(r => r.status === 'resolved').length} />
        </div>
      </header>

      {error && !showAddSheet && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12">
          <Loader size="md" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card p-10 flex flex-col items-center justify-center text-center gap-3 mt-4">
          <div className="w-12 h-12 bg-main-bg rounded-full flex items-center justify-center text-accent mb-2 shadow-sm">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-main-text">No {filter.replace('_', ' ')} tickets</h2>
          <p className="text-black/60 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(ticket => (
            <div key={ticket.id} className="card p-4 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-sm text-main-text">{ticket.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-black/60 font-medium">
                    <span className="text-main-text font-semibold">{ticket.tenant_name || 'Unknown Tenant'}</span>
                    <span>Room {ticket.room_number || 'N/A'}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg shrink-0 ${
                  ticket.status === 'open' ? 'bg-red-50 text-red-600' :
                  ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {ticket.status === 'open' ? <AlertCircle size={18} /> : 
                   ticket.status === 'in_progress' ? <Clock size={18} /> : 
                   <CheckCircle size={18} />}
                </div>
              </div>
              
              <p className="text-sm text-black/60 leading-relaxed bg-main-bg/50 p-3 rounded-lg border border-main-border">
                {ticket.description}
              </p>
              
              <div className="pt-2 flex justify-end gap-2 border-t border-main-border">
                {ticket.status === 'open' && (
                  <button 
                    onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                    disabled={updatingTicketId !== null}
                    className="px-4 py-2 bg-main-text text-white text-xs font-semibold rounded-md hover:bg-main-text/90 transition-colors tap-target disabled:opacity-50"
                  >
                    Start Work
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                    disabled={updatingTicketId !== null}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors tap-target disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
                {ticket.status === 'resolved' && (
                  <button 
                    onClick={() => handleUpdateStatus(ticket.id, 'open')}
                    disabled={updatingTicketId !== null}
                    className="px-4 py-2 bg-white text-main-text border border-main-border text-xs font-semibold rounded-md hover:bg-gray-50 transition-colors tap-target disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Ticket Sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddSheet(false)}
          />
          <div className="relative bg-white w-full max-w-[500px] mx-auto rounded-t-2xl shadow-2xl animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-main-border">
              <h2 className="text-lg font-bold text-main-text flex items-center gap-2">
                <Wrench className="text-accent" size={20} />
                New Ticket
              </h2>
              <button aria-label="Close add ticket sheet"
                onClick={() => setShowAddSheet(false)}
                className="text-black/40 hover:text-main-text p-2 rounded-full hover:bg-main-bg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Tenant</label>
                  <select 
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white disabled:opacity-60"
                    required
                    disabled={tenants.length === 0}
                  >
                    <option value="">{tenants.length === 0 ? "No active tenants available" : "Select a tenant..."}</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Room {t.room_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {tenants.length === 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      Add tenants to rooms first
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Issue Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Broken AC"
                    className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-main-text mb-1.5">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    rows={4}
                    className="w-full border border-main-border p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-main-text text-white py-3.5 rounded-lg font-semibold text-sm tap-target disabled:opacity-70 flex justify-center items-center gap-2 hover:bg-main-text/90 transition-colors"
                  >
                    {submitting ? (
                      <Loader inline size="sm" />
                    ) : (
                      "Create Ticket"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void; count: number }> = ({ label, active, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 tap-target ${
      active 
        ? 'bg-main-text text-white shadow-md' 
        : 'bg-white border border-main-border text-black/60 hover:text-main-text hover:border-black/20'
    }`}
  >
    {label}
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
      active ? 'bg-white/20 text-white' : 'bg-main-bg text-black/60'
    }`}>
      {count}
    </span>
  </button>
);

export default Maintenance;
