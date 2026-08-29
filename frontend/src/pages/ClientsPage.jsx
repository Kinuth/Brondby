import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { ClientModal } from '../components/clients/ClientModal';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2, 
  Loader2, 
  Briefcase 
} from 'lucide-react';

export const ClientsPage = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clientsData, isLoading, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const res = await apiClient.get('/clients/', {
        params: search ? { search } : {},
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/clients/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Cannot delete client. Historical jobs may be linked to this client.');
    }
  });

  const handleDelete = (client) => {
    if (window.confirm(`Are you sure you want to delete client "${client.name}"? Note: Deletion is blocked if historical investigations exist.`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const clients = clientsData?.results || clientsData || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Clients Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Corporate accounts, legal chambers, financial institutions, and high-net-worth clients across Africa
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Client</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, company, email, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {clients.length} Registered Accounts
        </div>
      </div>

      {/* Clients Grid / Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading clients directory...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-300">No clients found matching your search.</p>
            <p>Click "Register New Client" to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Client & Company</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Location / Address</th>
                  <th className="px-5 py-3.5 text-center">Cases Logged</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition">
                    {/* Name & Company */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">
                        {client.name}
                      </div>
                      {client.company_name ? (
                        <div className="text-xs text-brand-300 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {client.company_name}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Individual Account</span>
                      )}
                    </td>

                    {/* Contact Details */}
                    <td className="px-5 py-4 space-y-1">
                      {client.email ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No email</span>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-5 py-4 max-w-xs">
                      {client.address ? (
                        <div className="flex items-start gap-1.5 text-slate-400 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unspecified</span>
                      )}
                    </td>

                    {/* Cases Count */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs">
                        <Briefcase className="w-3 h-3 text-brand-400" />
                        {client.jobs_count || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setIsModalOpen(true);
                          }}
                          title="Edit Client"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          title="Delete Client"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          client={editingClient}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['clients_list'] });
          }}
        />
      )}
    </div>
  );
};
