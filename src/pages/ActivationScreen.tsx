import React, { useState } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { activatePG, getMyPG } from '../api/endpoints';
import Loader from '../components/Loader';

const ActivationScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) {
      setError('Please enter a valid activation code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await activatePG({ activation_code: code.toUpperCase() });
      await getMyPG();
      window.location.href = '/';
    } catch (err: any) {
      console.error("Activation error:", err);
      setError(err.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-main-bg px-4 py-12">
      <div className="mb-8 flex items-end">
        <h1 className="font-serif text-4xl text-main-text tracking-tight">Activate your PG</h1>
        <div className="w-2.5 h-2.5 bg-accent rounded-full ml-1.5 mb-2"></div>
      </div>

      <div className="w-full max-w-[400px] bg-white p-6 sm:p-10 rounded-[12px] border border-main-border shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_1px_2px_rgba(0,0,0,0.04)] animate-fade-up">
        
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-md mb-6 text-sm font-medium border border-danger/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-main-text mb-2 flex items-center gap-1.5">
              <KeyRound size={14} className="text-accent" />
              Activation Code
            </label>
            <input 
              type="text" 
              placeholder="e.g. PG-A8F2B1"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field text-center tracking-widest font-mono text-lg uppercase"
              required
              maxLength={10}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <Loader inline size="sm" />
            ) : (
              <>
                <CheckCircle2 size={16} />
                Activate
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivationScreen;
