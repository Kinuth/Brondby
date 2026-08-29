import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/jobs/StatusBadge';
import { JobDetailModal } from '../components/jobs/JobDetailModal';
import { StatusUpdateModal } from '../components/jobs/StatusUpdateModal';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  AlertTriangle, 
  ArrowUpRight, 
  Activity,
  History,
  FileCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAdmin, isWorker } = useAuth();
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusModalJob, setStatusModalJob] = useState(null);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats/');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm">Aggregating real-time investigations metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
        Failed to load dashboard data. Please verify your connection or re-login.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.first_name || user?.username}
          </h2>
          <p className="text-sm text-slate-400">
            {isAdmin 
              ? 'Pan-African Corporate Intelligence Executive Overview & Operations Control' 
              : 'Assigned Field Investigations & Case Milestones'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition"
          >
            <Briefcase className="w-4 h-4" />
            <span>{isAdmin ? 'Manage All Jobs' : 'View My Jobs'}</span>
          </Link>
          {isAdmin && (
            <Link
              to="/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Billing Center</span>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================================================
          ADMIN VIEW: Full System Metrics, Revenue Analysis, & Audit Log
         ========================================================================= */}
      {isAdmin && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Jobs */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cases</span>
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">{stats?.total_jobs || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Across all 5 service types</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active / Pending</span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {(stats?.status_counts?.assigned || 0) + (stats?.status_counts?.pending || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.status_counts?.pending || 0} in field investigation
                </p>
              </div>
            </div>

            {/* Paid Revenue */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Settled Revenue</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  ${Number(stats?.financials?.total_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.financials?.paid_count || 0} completed invoices paid
                </p>
              </div>
            </div>

            {/* Outstanding Revenue */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Invoiced</span>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
                  ${Number(stats?.financials?.total_outstanding || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.financials?.unpaid_count || 0} unpaid invoices awaiting settlement
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Status Distribution & Financial Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Investigation Pipeline by Status
                </h3>
                <span className="text-xs text-slate-400">{stats?.total_jobs || 0} Total Cases</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { key: 'incoming', label: 'Incoming', color: 'border-sky-500/40 bg-sky-500/5 text-sky-400' },
                  { key: 'assigned', label: 'Assigned', color: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400' },
                  { key: 'pending', label: 'Pending', color: 'border-amber-500/40 bg-amber-500/5 text-amber-400' },
                  { key: 'completed', label: 'Completed', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' },
                  { key: 'cancelled', label: 'Cancelled', color: 'border-rose-500/40 bg-rose-500/5 text-rose-400' },
                ].map((s) => (
                  <div key={s.key} className={`p-4 rounded-xl border ${s.color} text-center space-y-1`}>
                    <div className="text-2xl font-bold text-white">
                      {stats?.status_counts?.[s.key] || 0}
                    </div>
                    <div className="text-xs font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Revenue Summary
                </h3>
                <p className="text-xs text-slate-400">Total Billed vs Collected</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Total Billed:</span>
                  <span className="text-white">${Number(stats?.financials?.total_invoiced || 0).toFixed(2)}</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 transition-all duration-500" 
                    style={{ 
                      width: `${(stats?.financials?.total_invoiced > 0 
                        ? (stats?.financials?.total_paid / stats?.financials?.total_invoiced) * 100 
                        : 0)}%` 
                    }}
                    title="Paid"
                  />
                  <div 
                    className="bg-rose-500 transition-all duration-500" 
                    style={{ 
                      width: `${(stats?.financials?.total_invoiced > 0 
                        ? (stats?.financials?.total_outstanding / stats?.financials?.total_invoiced) * 100 
                        : 0)}%` 
                    }}
                    title="Outstanding"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Paid (${Number(stats?.financials?.total_paid || 0).toFixed(0)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Outstanding (${Number(stats?.financials?.total_outstanding || 0).toFixed(0)})</span>
                  </div>
                </div>
              </div>

              <Link
                to="/invoices"
                className="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Open Full Invoicing Ledger →
              </Link>
            </div>
          </div>

          {/* Recent Audit Activity Feed */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Real-Time Investigation Audit Feed
                </h3>
              </div>
              <span className="text-xs text-slate-400">Latest 10 logged transitions</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 italic">No activity recorded yet.</p>
              ) : (
                stats.recent_activity.map((log) => (
                  <div key={log.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400">
                        #{log.job}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium text-white">
                          <span>{log.changed_by_name}</span>
                          <span className="text-slate-500">updated Job #{log.job}</span>
                        </div>
                        {log.note && (
                          <p className="text-slate-400 text-[11px] mt-0.5 max-w-md truncate">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 uppercase text-[10px]">{log.old_status}</span>
                        <span className="text-slate-500">→</span>
                        <StatusBadge status={log.new_status} size="xs" />
                      </div>
                      <span className="text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          WORKER VIEW: Personal Task Tracking & Upcoming Deadlines
         ========================================================================= */}
      {isWorker && (
        <>
          {/* Worker KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned To Me</span>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">{stats?.total_jobs || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Total investigations assigned to you</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress / Pending</span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {(stats?.status_counts?.assigned || 0) + (stats?.status_counts?.pending || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Requires active field research or reports</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed By Me</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {stats?.status_counts?.completed || 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">Successfully concluded investigations</p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Table */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Upcoming Due Dates & Actionable Cases
                </h3>
              </div>
              <span className="text-xs text-slate-400">Active assigned jobs</span>
            </div>

            {(!stats?.upcoming_deadlines || stats.upcoming_deadlines.length === 0) ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/30 border border-slate-800 text-slate-400 text-xs">
                No active jobs with imminent deadlines. Great job!
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Job ID</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.upcoming_deadlines.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-brand-400">#{job.id}</td>
                        <td className="px-4 py-3 font-medium text-white">{job.service_type_detail?.name}</td>
                        <td className="px-4 py-3 text-slate-300">{job.client_detail?.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-slate-200 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-brand-400" />
                            {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} size="xs" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setStatusModalJob(job)}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Status Update Modal */}
      {statusModalJob && (
        <StatusUpdateModal
          isOpen={Boolean(statusModalJob)}
          onClose={() => setStatusModalJob(null)}
          job={statusModalJob}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
