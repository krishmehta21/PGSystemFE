import React, { useState, useEffect } from 'react';
import { createPG, getAdminPGs, updatePGSubscription } from '../api/endpoints';
import Loader from '../components/Loader';
import { Plus, Building2, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PG } from '../api/types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [pgsLoading, setPgsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pgs, setPgs] = useState<PG[]>([]);
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchPGs = async () => {
    setPgsLoading(true);
    try {
      const data = await getAdminPGs();
      setPgs(data);
    } catch (err: any) {
      console.error("Failed to fetch PGs:", err);
    } finally {
      setPgsLoading(false);
    }
  };

  useEffect(() => {
    fetchPGs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessCode('');
    setCopied(false);
    
    try {
      const response = await createPG({ name, address });
      setSuccessCode(response.activation_code || 'Unknown Code Generated');
      setName('');
      setAddress('');
      fetchPGs();
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = (pgId: string) => {
    localStorage.setItem('pg_context_id', pgId);
    navigate('/');
    window.location.reload();
  };

  const handleToggleSubscription = async (pgId: string, isActive: boolean) => {
    try {
      await updatePGSubscription(pgId, {
        is_active: isActive,
        subscription_status: isActive ? "active" : "suspended"
      });
      fetchPGs();
    } catch (err: any) {
      console.error("Failed to update subscription:", err);
      alert("Failed to update subscription");
    }
  };

  const handleWarnSubscription = async (pgId: string) => {
    try {
      await updatePGSubscription(pgId, {
        is_active: true,
        subscription_status: "warning"
      });
      fetchPGs();
    } catch (err: any) {
      console.error("Failed to warn subscription:", err);
      alert("Failed to warn");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(successCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
      {/* Creation Side */}
      <div className="card overflow-hidden h-fit">
        <div className="bg-main-text border-b border-white/10 p-6 text-white">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 bg-white/10 rounded-lg w-fit">
              <Building2 className="text-accent" size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">New Property</h1>
          </div>
          <p className="text-white/50 font-medium text-sm ml-0.5">Create a new PG workspace and generate an activation key.</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-200 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {successCode && (
            <div className="mb-5 card p-5 flex flex-col items-center border-accent/30">
              <p className="text-black/60 font-semibold uppercase tracking-widest text-[10px] mb-1">Activation Key</p>
              <div 
                onClick={copyToClipboard}
                className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-all"
              >
                <span className="text-3xl font-bold text-main-text tracking-widest font-mono break-all">{successCode}</span>
                <div className={`p-2 rounded-md transition-all duration-200 ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-black/60 group-hover:bg-accent/10 group-hover:text-accent'}`}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </div>
              </div>
              {copied && <span className="text-emerald-600 text-xs font-semibold mt-1">Copied to clipboard!</span>}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-main-text">PG Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Royal Gents PG"
                className="w-full border border-main-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm placeholder:text-black/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-main-text">Physical Address</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Required for billing & tracking"
                className="w-full border border-main-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm placeholder:text-black/40 resize-none"
                rows={3}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-main-text text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader inline size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} className="text-accent" />
                  Create Workspace
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* List Side */}
      <div className="h-full flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-main-text">Active Workspaces</h2>
          <button aria-label="Refresh workspaces" onClick={fetchPGs} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors">
            <RefreshCw size={16} className={pgsLoading ? "animate-spin text-black/60" : "text-black/60"} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 max-h-[700px]">
          {pgsLoading && pgs.length === 0 ? (
            <div className="py-12">
              <Loader size="md" />
            </div>
          ) : pgs.length === 0 ? (
            <div className="card p-10 text-center border-dashed">
              <Building2 className="mx-auto text-black/40 mb-3" size={36} />
              <p className="text-black/60 font-medium text-sm">No properties created yet.</p>
            </div>
          ) : (
            pgs.map((pg) => (
              <div key={pg.id} className="card group p-5 hover:border-gray-300 transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-main-text">{pg.name}</h3>
                    <p className="text-xs text-black/60 font-medium truncate max-w-[250px] mt-0.5">{pg.address}</p>
                  </div>
                  <div className="p-1.5 bg-gray-50 rounded-md group-hover:bg-accent/10 transition-colors border border-main-border">
                    <Building2 className="text-black/40 group-hover:text-accent transition-colors" size={16} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <div className="bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1.5 border border-main-border">
                    <span className="text-[9px] uppercase font-semibold text-black/40 tracking-wider">Key</span>
                    <span className="font-mono font-semibold text-xs text-main-text">{pg.activation_code}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    pg.subscription_status === 'suspended' ? 'bg-red-100 text-red-600' :
                    pg.subscription_status === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {pg.subscription_status === 'suspended' ? 'Suspended' : pg.subscription_status === 'warning' ? 'Warning' : 'Active'}
                  </span>
                  
                  <div className="flex-1"></div>

                  <button 
                    onClick={() => handleWarnSubscription(pg.id)}
                    className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-semibold text-xs"
                  >
                    Warn
                  </button>

                  <label className="flex items-center cursor-pointer mx-1" title="Toggle Active Status">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={pg.is_active !== false}
                        onChange={(e) => handleToggleSubscription(pg.id, e.target.checked)}
                      />
                      <div className={`block w-8 h-4 rounded-full transition-colors ${pg.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-[2px] top-[2px] bg-white w-3 h-3 rounded-full transition-transform ${pg.is_active !== false ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                  
                  <button 
                    onClick={() => handleManage(pg.id)}
                    className="flex items-center gap-1.5 bg-main-text text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-accent transition-colors"
                  >
                    Manage
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

