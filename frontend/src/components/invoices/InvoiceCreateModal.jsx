import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import apiClient from '../../api/client';
import { Loader2, AlertCircle, Receipt, DollarSign, CheckCircle2 } from 'lucide-react';

export const InvoiceCreateModal = ({ isOpen, onClose, onSuccess, preselectedJobId = null }) => {
  const [unbilledJobs, setUnbilledJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId || '');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchUnbilled = async () => {
        setFetchingJobs(true);
        try {
          const res = await apiClient.get('/invoices/unbilled_jobs/');
          setUnbilledJobs(res.data);
          if (preselectedJobId) {
            setSelectedJobId(preselectedJobId);
          } else if (res.data.length > 0 && !selectedJobId) {
            setSelectedJobId(res.data[0].id);
          }
        } catch (err) {
          console.error('Failed to load unbilled jobs:', err);
        } finally {
          setFetchingJobs(false);
        }
      };

      fetchUnbilled();
      setError('');
    }
  }, [isOpen, preselectedJobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId) {
      setError('Please select a job to invoice.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid invoice amount greater than $0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/invoices/', {
        job: parseInt(selectedJobId),
        amount: parseFloat(amount),
        status,
        notes,
      });

      onSuccess?.();
      onClose();
      // Reset form
      setAmount('');
      setNotes('');
      setStatus('unpaid');
    } catch (err) {
      console.error('Failed to create invoice:', err);
      const errMsg = err.response?.data?.amount?.[0] || 
                     err.response?.data?.job?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to generate invoice.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = unbilledJobs.find((j) => String(j.id) === String(selectedJobId));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Client Invoice" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Job Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Job to Bill <span className="text-rose-400">*</span>
          </label>
          {fetchingJobs ? (
            <div className="p-3 rounded-lg bg-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Loading available unbilled jobs...
            </div>
          ) : unbilledJobs.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              No unbilled jobs found. All existing jobs have already been invoiced or none have been created.
            </div>
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Choose Job --</option>
              {unbilledJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  Job #{j.id}: {j.service_type_detail?.name} - {j.client_detail?.name} ({j.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Job Card Preview */}
        {selectedJob && (
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs space-y-1 text-slate-300">
            <div className="font-semibold text-white">Client: {selectedJob.client_detail?.name}</div>
            <div>Service: {selectedJob.service_type_detail?.name}</div>
            <div className="text-slate-400 capitalize">Status: {selectedJob.status}</div>
          </div>
        )}

        {/* Amount & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Invoice Amount (USD) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="2500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-8 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Payment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="unpaid">Unpaid / Issued</option>
              <option value="paid">Already Paid</option>
            </select>
          </div>
        </div>

        {/* Payment Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Payment Terms / Invoice Notes
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Payable within 30 days. Wire transfer to Standard Bank Nairobi Branch."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedJobId || !amount}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-brand-600/30 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Issue Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
