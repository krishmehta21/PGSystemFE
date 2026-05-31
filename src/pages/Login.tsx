import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as client from '../api/client';

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-main-bg px-4 py-12">
      <div className="mb-8 flex items-end">
        <h1 className="font-serif text-4xl text-main-text tracking-tight">PG Control</h1>
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
