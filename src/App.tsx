import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { getMyPG } from './api/endpoints';
import Loader from './components/Loader';
import { startKeepAlive, stopKeepAlive } from './utils/keepAlive';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminRevenue = React.lazy(() => import('./pages/AdminRevenue'));
const Rooms = React.lazy(() => import('./pages/Rooms'));
const Tenants = React.lazy(() => import('./pages/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/TenantDetail'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ActivationScreen = React.lazy(() => import('./pages/ActivationScreen'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const Paywall = React.lazy(() => import('./pages/Paywall'));

const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode, requireRole?: 'admin' | 'owner' }) => {
  const token = localStorage.getItem('pg_token');
  const role = localStorage.getItem('pg_role') || 'owner';
  const contextId = localStorage.getItem('pg_context_id');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admins can see owner pages IF they have selected a workspace context
  if (role === 'admin' && requireRole === 'owner' && !contextId) {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'owner' && requireRole === 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PGGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [noPG, setNoPG] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const checkPG = async () => {
      try {
        const pg = await getMyPG();
        if (pg.is_active === false) {
          setIsSuspended(true);
        }
        setNoPG(false);
      } catch (err: any) {
        if (err.status === 404) {
          setNoPG(true);
        } else {
          console.error("PG Check failed:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    checkPG();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (noPG) {
    return <ActivationScreen />;
  }

  if (isSuspended) {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    const id = startKeepAlive();
    return () => stopKeepAlive(id);
  }, []);

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-main-bg flex items-center justify-center">
          <Loader size="lg" label="Loading..." />
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="revenue" element={<AdminRevenue />} />
          </Route>

          <Route path="/suspended" element={
            <ProtectedRoute requireRole="owner">
              <Paywall />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute requireRole="owner">
              <PGGuard>
                <Layout />
              </PGGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenant/:id" element={<TenantDetail />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

