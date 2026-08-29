import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/jobs/StatusBadge';
import { JobDetailModal } from '../components/jobs/JobDetailModal';
import { StatusUpdateModal } from '../components/jobs/StatusUpdateModal';
import { JobCreateModal } from '../components/jobs/JobCreateModal';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2,
  RefreshCw
} from 'lucide-react';

export const JobsPage = () => {
  const { user, isAdmin, isWorker } = useAuth();
  const queryClient = useQueryClient();

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [detailJob, setDetailJob] = useState(null);
  const [statusJob, setStatusJob] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 1. Fetch Jobs with filters
  const { 
    data: jobsData, 
    isLoading: loadingJobs, 
    isFetching: fetchingJobs,
    refetch: refetchJobs 
  } = useQuery({
    queryKey: ['jobs', statusFilter, serviceFilter, workerFilter, searchQuery],
    queryFn: async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (serviceFilter) params.service_type = serviceFilter;
      if (workerFilter && isAdmin) params.assigned_worker = workerFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await apiClient.get('/jobs/', { params });
      return res.data;
    },
  });

  // 2. Fetch Auxiliary Data (Services, Workers, Clients)
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient.get('/services/');
      return res.data?.results || res.data;
    },
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiClient.get('/users/?role=worker');
      return res.data?.results || res.data;
    },
    enabled: isAdmin,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients_list'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiClient.get('/clients/');
      return res.data?.results || res.data;
    },
    enabled: isAdmin,
  });

  // Delete Job Mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/jobs/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to delete job.');
    }
  });

  const handleDelete = (job) => {
    if (window.confirm(`Are you sure you want to delete Job #${job.id} (${job.service_type_detail?.name})?`)) {
      deleteMutation.mutate(job.id);
    }
  };

  const jobsList = jobsData?.results || jobsData || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Investigation Cases Ledger' : 'My Assigned Investigations'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Comprehensive tracking across company documents, EDD, legal checks, background screening & residency programs'
              : 'Execute and record status progression for your assigned case files'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchJobs()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 shadow-2xs transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingJobs ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 text-xs">
          {[
            { key: '', label: 'All Cases' },
            { key: 'incoming', label: 'Incoming' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'pending', label: 'Pending / Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === tab.key
                  ? 'bg-brand-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, target, or description..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Service Type Dropdown */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Service Types</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Worker Dropdown (Admin only) */}
          {isAdmin && (
            <div>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Investigators</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name || w.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(statusFilter || serviceFilter || workerFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setServiceFilter('');
                setWorkerFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition self-center"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loadingJobs ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading cases...</p>
          </div>
        ) : jobsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-800">No matching investigation cases found.</p>
            <p>Try adjusting your search criteria or filter tabs above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Client & Target</th>
                  <th className="px-5 py-3.5">Service Type</th>
                  <th className="px-5 py-3.5">Investigator</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobsList.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition">
                    {/* ID */}
                    <td className="px-5 py-4 font-mono font-bold text-brand-600">
                      #{job.id}
                    </td>

                    {/* Client */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {job.client_detail?.name}
                      </div>
                      {job.client_detail?.company_name && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          {job.client_detail.company_name}
                        </div>
                      )}
                    </td>

                    {/* Service Type */}
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-800">
                        {job.service_type_detail?.name}
                      </span>
                    </td>

                    {/* Investigator */}
                    <td className="px-5 py-4">
                      {job.assigned_worker_detail ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          {job.assigned_worker_detail.full_name || job.assigned_worker_detail.username}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details / Audit Trail */}
                        <button
                          onClick={() => setDetailJob(job)}
                          title="View Case Audit History"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Status Update Control */}
                        <button
                          onClick={() => setStatusJob(job)}
                          title={isWorker ? "Advance Job Status" : "Edit / Change Status"}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Status</span>
                        </button>

                        {/* Delete (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(job)}
                            title="Delete Case"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {detailJob && (
        <JobDetailModal
          isOpen={Boolean(detailJob)}
          onClose={() => setDetailJob(null)}
          job={detailJob}
          onOpenStatusUpdate={(job) => setStatusJob(job)}
        />
      )}

      {statusJob && (
        <StatusUpdateModal
          isOpen={Boolean(statusJob)}
          onClose={() => setStatusJob(null)}
          job={statusJob}
          workers={workers}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          }}
        />
      )}

      {isCreateOpen && (
        <JobCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          clients={clients}
          services={services}
          workers={workers}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          }}
        />
      )}
    </div>
  );
};
