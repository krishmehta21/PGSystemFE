import React, { useState, useEffect } from 'react';
import { Home, MapPin, MessageSquare, Save, LogOut, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyPG, updatePG } from '../api/endpoints';
import Loader from '../components/Loader';
import type { PG } from '../api/types';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [pg, setPg] = useState<PG | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [template, setTemplate] = useState('');

  useEffect(() => {
    const fetchPG = async () => {
      try {
        const data = await getMyPG();
        setPg(data);
        setName(data.name);
        setAddress(data.address || '');
        setTemplate(data.whatsapp_message_template);
      } catch (err: any) {
        console.error(err);
        if (err.status === 404) {
          setError('No PG property linked to your account.');
        } else {
          setError('Failed to load settings. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPG();
  }, []);

  const handleSave = async () => {
    if (!pg) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updatePG(pg.id, {
        name,
        address,
        whatsapp_message_template: template
      });
      setPg(updated);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="py-24">
        <Loader size="lg" label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-5 pb-24">
      <header className="h-16 flex items-center justify-center relative mb-5">
        <button aria-label="Go back" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="absolute left-0 p-2 -ml-2 transition-colors active:bg-gray-100 rounded-md tap-target">
          <ChevronLeft size={24} className="text-main-text" />
        </button>
        <h1 className="text-lg font-bold text-main-text">Settings</h1>
        <button 
          onClick={handleLogout}
          className="absolute right-0 text-red-600 font-semibold text-xs flex items-center gap-1.5 tap-target bg-red-50 px-2 py-1.5 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
        >
          <LogOut size={14} /> Logout
        </button>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-5 text-sm font-medium border border-emerald-200">
          {success}
        </div>
      )}

      {pg ? (
        <div className="space-y-6">
          {/* PG Info */}
          <section className="space-y-4">
            <h3 className="text-black/60 text-xs font-semibold tracking-widest uppercase">Property Details</h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">PG Name</label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-main-border p-3 pl-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-main-text mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 text-black/40" size={16} />
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full border border-main-border p-3 pl-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Reminder Message */}
          <section className="space-y-3.5">
            <h3 className="text-black/60 text-xs font-semibold tracking-widest uppercase">WhatsApp Template</h3>
            <div>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 text-black/40" size={16} />
                <textarea 
                  rows={4}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full border border-main-border p-3 pl-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                />
              </div>
              <p className="text-black/60 text-xs mt-2 bg-main-bg p-3 rounded-lg border border-main-border">
                Placeholders: <span className="font-semibold text-main-text">&#123;name&#125;</span>, <span className="font-semibold text-main-text">&#123;amount&#125;</span>, <span className="font-semibold text-main-text">&#123;pgName&#125;</span>
              </p>
            </div>
          </section>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-main-text text-white py-3.5 rounded-lg text-sm font-semibold tap-target flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-70"
          >
            {saving ? (
              <Loader inline size="sm" />
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-8 text-center card p-8">
          <Home className="mx-auto text-black/40 mb-3" size={40} />
          <h2 className="text-base font-bold text-main-text mb-1.5">No Property Found</h2>
          <p className="text-sm text-black/60 max-w-[260px] mx-auto">Please contact your administrator to receive an activation code.</p>
        </div>
      )}

      {/* App Info */}
      <section className="space-y-0.5 pt-6 border-t border-main-border text-center mt-8">
        <p className="text-xs font-semibold text-black/40 tracking-wide uppercase">RentFlow System</p>
        <p className="text-xs text-black/60 font-medium">Version 1.0.0</p>
      </section>
    </div>
  );
};

export default Settings;

