import React, { useEffect, useState } from 'react';
import { getAdminRevenue, getAdminActivity } from '../api/endpoints';
import Loader from '../components/Loader';
import { IndianRupee, Building2, AlertTriangle, XCircle, TrendingUp, Activity } from 'lucide-react';
import type { AdminRevenueResponse, AdminActivityResponse } from '../api/types';

const AdminRevenue: React.FC = () => {
  const [data, setData] = useState<AdminRevenueResponse | null>(null);
  const [activityData, setActivityData] = useState<AdminActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revenueRes, activityRes] = await Promise.all([
          getAdminRevenue(),
          getAdminActivity().catch(() => null)
        ]);
        setData(revenueRes);
        setActivityData(activityRes);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader size="md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center pt-20 text-main-text opacity-50">
        Failed to load revenue data.
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getExpirationStatus = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    
    // Normalize times for date comparison
    end.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring_soon';
    return 'active';
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMins = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const getActivityColor = (dateString: string | null) => {
    if (!dateString) return "bg-red-500";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return "bg-green-500";
    if (diffDays <= 7) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 px-4 pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-serif text-main-text flex items-center gap-2">
          <TrendingUp className="text-accent" />
          Revenue Dashboard
        </h1>
        <p className="text-black/60 text-sm mt-1">Overview of monthly recurring revenue and subscription statuses.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6 border-accent/20 bg-gradient-to-br from-white to-accent/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-lg text-accent">
              <IndianRupee size={20} />
            </div>
            <h3 className="font-semibold text-main-text text-sm">Total MRR</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-accent">
            {formatCurrency(data.total_monthly_revenue)}
          </div>
          <p className="text-xs text-black/50 mt-1 uppercase tracking-wider font-semibold">Active properties only</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Building2 size={20} />
            </div>
            <h3 className="font-semibold text-main-text text-sm">Active PGs</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-green-600">
            {data.active_pg_count}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-main-text text-sm">Warning PGs</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600">
            {data.warning_pg_count}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
            <h3 className="font-semibold text-main-text text-sm">Suspended</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-red-600">
            {data.suspended_pg_count}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-main-border bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-main-text">Property Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-main-border bg-white text-black/60 font-medium uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">PG Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Price / Mo</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-border">
              {data.pgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-black/50">No properties found.</td>
                </tr>
              ) : (
                data.pgs.map((pg, idx) => {
                  const expirationStatus = getExpirationStatus(pg.subscription_end);
                  let rowClass = "hover:bg-gray-50 transition-colors";
                  if (expirationStatus === 'expired') {
                    rowClass = "bg-red-50 hover:bg-red-100 transition-colors text-red-900";
                  } else if (expirationStatus === 'expiring_soon') {
                    rowClass = "bg-amber-50 hover:bg-amber-100 transition-colors text-amber-900";
                  }

                  return (
                    <tr key={idx} className={rowClass}>
                      <td className="px-6 py-4 font-semibold">
                        {pg.pg_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pg.subscription_status === 'suspended' ? 'bg-red-100 text-red-700' :
                          pg.subscription_status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {pg.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {formatCurrency(pg.monthly_price)}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const activity = activityData?.pgs.find(a => a.pg_name === pg.pg_name);
                          if (!activity) return <span className="text-black/40 text-xs">No data</span>;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.last_seen)}`} />
                                <span className="text-xs font-medium text-main-text">
                                  {getRelativeTime(activity.last_seen)}
                                </span>
                              </div>
                              <div className="text-[10px] text-black/50 ml-4 flex items-center gap-1">
                                <Activity size={10} />
                                {activity.logins_last_7_days} logins / 7d
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-black/60">
                        {pg.subscription_start || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${expirationStatus === 'expired' ? 'text-red-600 font-bold' : expirationStatus === 'expiring_soon' ? 'text-amber-600 font-bold' : 'text-black/60'}`}>
                          {pg.subscription_end || '—'}
                        </span>
                        {expirationStatus === 'expired' && (
                          <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Expired</span>
                        )}
                        {expirationStatus === 'expiring_soon' && (
                          <span className="ml-2 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Expiring</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-main-border text-right">
          <p className="text-sm font-medium text-main-text">
            Projected monthly revenue: <span className="font-mono font-bold text-accent">{formatCurrency(data.total_monthly_revenue)}</span> from <span className="font-bold">{data.active_pg_count}</span> active properties
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
