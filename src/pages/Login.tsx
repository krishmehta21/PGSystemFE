import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as client from '../api/client';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await client.post<{ access_token: string; pg_id: string | null; role: string }>('/api/v1/auth/login', {
        email,
        password,
      });
      
      localStorage.setItem('pg_token', response.access_token);
      localStorage.setItem('pg_role', response.role || 'owner');
      if (response.pg_id) {
        localStorage.setItem('pg_id', response.pg_id);
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-main-bg px-4 py-12">
      <div className="mb-8 flex items-end">
        <h1 className="font-serif text-4xl text-main-text tracking-tight">RentFlow</h1>
        <div className="w-2.5 h-2.5 bg-accent rounded-full ml-1.5 mb-2"></div>
      </div>

      <div className="w-full max-w-[400px] bg-white p-6 sm:p-10 rounded-[12px] border border-main-border shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_1px_2px_rgba(0,0,0,0.04)] animate-fade-up">
        <div className="mb-8">
          <h2 className="font-serif text-2xl text-main-text">Welcome back</h2>
          <p className="text-sm text-text-secondary mt-1">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-md mb-6 text-sm font-medium border border-danger/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-main-text mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="owner@pg.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-main-text mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-main-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-text-secondary">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors text-main-text font-medium text-sm gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setEmail('demo@rentflow.in');
              setPassword('Demo@1234');
              // Using a slight delay to ensure state updates before form submission
              setTimeout(() => {
                const formEvent = { preventDefault: () => {} } as React.FormEvent;
                handleLogin(formEvent);
              }, 100);
            }}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-main-border rounded-md shadow-sm text-sm font-medium text-main-text bg-white hover:bg-main-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
          >
            👀 Explore Demo Account
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-main-text hover:text-accent transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
