import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const StatusUpdateModal = ({ isOpen, onClose, job, onSuccess, workers = [] }) => {
  const { isAdmin, isWorker } = useAuth();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [assignedWorker, setAssignedWorker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      if (isWorker) {
        if (job.status === 'assigned') setStatus('pending');
        else if (job.status === 'pending') setStatus('completed');
        else setStatus(job.status);
      } else {
        setStatus(job.status);
        setAssignedWorker(job.assigned_worker || '');
      }
      setNote('');
      setError('');
    }
  }, [job, isWorker]);

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        status,
        status_note: note,
      };

      if (isAdmin && assignedWorker !== undefined) {
        payload.assigned_worker = assignedWorker || null;
      }

      await apiClient.patch(`/jobs/${job.id}/`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
      const errMsg = err.response?.data?.status?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to update job status.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = () => {
    if (isAdmin) {
      return [
        { value: 'incoming', label: 'Incoming' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'pending', label: 'Pending / In-Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }

    if (job.status === 'assigned') {
      return [
        { value: 'pending', label: 'Move to Pending (Start Investigation)' }
      ];
    }
    if (job.status === 'pending') {
      return [
        { value: 'completed', label: 'Mark as Completed' }
      ];
    }

    return [];
  };

  const statusOptions = getStatusOptions();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Case #${job.id} Status`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status Transition Header */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Current Status</span>
            <div><StatusBadge status={job.status} /></div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Target Status</span>
            <div><StatusBadge status={status || job.status} /></div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Worker Reassignment (Admin Only) */}
        {isAdmin && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Assigned Investigator
            </label>
            <select
              value={assignedWorker}
              onChange={(e) => setAssignedWorker(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Unassigned --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name || w.username} ({w.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {isWorker ? 'Advance Status' : 'Change Status'}
          </label>
          {statusOptions.length === 0 ? (
            <p className="text-xs text-amber-800 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              This case is in <strong>{job.status}</strong> status. No further worker transitions are available.
            </p>
          ) : (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Audit / Progress Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span>Audit Trail Progress Note</span>
            <span className="text-[10px] text-slate-400 font-normal">Recorded into immutable history</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows="3"
            placeholder={isWorker ? "E.g. Retrieved certificate from registry, contacting notary..." : "E.g. Reassigned to Senior Investigator per client request..."}
            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || statusOptions.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Status Update
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
