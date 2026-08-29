import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { InvoiceCreateModal } from '../components/invoices/InvoiceCreateModal';
import { InvoiceReceiptModal } from '../components/invoices/InvoiceReceiptModal';
import { 
  Receipt, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Printer, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

export const InvoicesPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const queryClient = useQueryClient();

  // Fetch Invoices
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['invoices', statusFilter, searchQuery],
    queryFn: async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await apiClient.get('/invoices/', { params });
      return res.data;
    },
  });

  // Mark as Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.post(`/invoices/${id}/mark_paid/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to mark invoice as paid.');
    }
  });

  const handleMarkPaid = (inv) => {
    if (window.confirm(`Mark Invoice ${inv.invoice_number} ($${inv.amount}) as PAID today?`)) {
      markPaidMutation.mutate(inv.id);
    }
  };

  const invoicesList = invoicesData?.results || invoicesData || [];

  // Financial aggregates from list
  const totalAmount = invoicesList.reduce((acc, inv) => acc + Number(inv.amount), 0);
  const paidAmount = invoicesList
    .filter((inv) => inv.status === 'paid')
    .reduce((acc, inv) => acc + Number(inv.amount), 0);
  const unpaidAmount = invoicesList
    .filter((inv) => inv.status === 'unpaid')
    .reduce((acc, inv) => acc + Number(inv.amount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Invoices & Financial Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Bill completed investigation cases, monitor client receivables, and issue certified receipts
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Invoiced</span>
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-white">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">{invoicesList.length} Total Invoices</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid & Collected</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-emerald-400">
              ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {invoicesList.filter((i) => i.status === 'paid').length} Paid Invoices
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Receivables</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-rose-400">
              ${unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {invoicesList.filter((i) => i.status === 'unpaid').length} Pending Settlement
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { key: '', label: 'All Invoices' },
            { key: 'unpaid', label: 'Unpaid / Pending' },
            { key: 'paid', label: 'Settled / Paid' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === tab.key
                  ? 'bg-brand-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number or client..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading invoicing ledger...</p>
          </div>
        ) : invoicesList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-300">No invoices found.</p>
            <p>Click "Create New Invoice" to generate an invoice from a case file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Service Reference</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Issued Date</th>
                  <th className="px-5 py-3.5">Paid Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoicesList.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      {/* Invoice # */}
                      <td className="px-5 py-4 font-mono font-bold text-brand-400">
                        {inv.invoice_number}
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4 font-semibold text-white">
                        {inv.client_name}
                      </td>

                      {/* Service */}
                      <td className="px-5 py-4 text-slate-300">
                        <div>{inv.service_type_name}</div>
                        <span className="text-[10px] text-slate-500 font-mono">Job #{inv.job}</span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-bold text-white text-sm">
                        ${Number(inv.amount).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Issued Date */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                        {new Date(inv.issued_date).toLocaleDateString()}
                      </td>

                      {/* Paid Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {inv.paid_date ? (
                          <span className="text-emerald-400 font-medium">
                            {new Date(inv.paid_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Mark as Paid button (only if unpaid) */}
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              title="Mark as Settled / Paid"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Paid</span>
                            </button>
                          )}

                          {/* Print / View Receipt */}
                          <button
                            onClick={() => setSelectedReceipt(inv)}
                            title="Preview / Print Official Receipt"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <InvoiceCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          }}
        />
      )}

      {selectedReceipt && (
        <InvoiceReceiptModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          invoice={selectedReceipt}
        />
      )}
    </div>
  );
};
