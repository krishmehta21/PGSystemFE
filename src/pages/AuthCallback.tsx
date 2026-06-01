import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as client from '../api/client';
import Loader from '../components/Loader';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        const session = data.session;
        if (!session) {
          throw new Error('No session found. Please try logging in again.');
        }

        // Send token to our backend
        const response = await client.post<{ access_token: string; pg_id: string | null; role: string }>('/api/v1/auth/google', {
          access_token: session.access_token,
        });

        // Store RentFlow JWT and redirect
        localStorage.setItem('pg_token', response.access_token);
        localStorage.setItem('pg_role', response.role || 'owner');
        if (response.pg_id) {
          localStorage.setItem('pg_id', response.pg_id);
        }

        navigate('/');
      } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-main-bg px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-sm w-full border border-red-200">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-main-text mb-2">Login Failed</h2>
          <p className="text-sm text-black/60 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-main-bg">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-6 text-sm font-medium text-black/60 animate-pulse">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
