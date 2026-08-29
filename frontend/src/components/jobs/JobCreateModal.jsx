import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import apiClient from '../../api/client';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';

export const JobCreateModal = ({ isOpen, onClose, onSuccess, clients = [], services = [], workers = [] }) => {
  const [formData, setFormData] = useState({
    client: '',
    service_type: '',
    assigned_worker: '',
    status: 'incoming',
    due_date: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-switch to assigned if a worker is selected and status is incoming
      if (name === 'assigned_worker' && value && prev.status === 'incoming') {
        updated.status = 'assigned';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        client: parseInt(formData.client),
        service_type: parseInt(formData.service_type),
        assigned_worker: formData.assigned_worker ? parseInt(formData.assigned_worker) : null,
        status: formData.status,
        due_date: formData.due_date || null,
        description: formData.description,
        notes: formData.notes,
        status_note: 'Initial job entry created by Admin.',
      };

      await apiClient.post('/jobs/', payload);
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        client: '',
        service_type: '',
        assigned_worker: '',
        status: 'incoming',
        due_date: '',
        description: '',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to create job:', err);
      const errMsg = err.response?.data?.client?.[0] || 
                     err.response?.data?.service_type?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to create job. Please verify all required fields.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Investigation Job" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Client <span className="text-rose-400">*</span>
            </label>
            <select
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company_name ? `(${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Service Type <span className="text-rose-400">*</span>
            </label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Select Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assign Investigator */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Assign Investigator
            </label>
            <select
              name="assigned_worker"
              value={formData.assigned_worker}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Leave Unassigned --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name || w.username}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Initial Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="incoming">Incoming</option>
              <option value="assigned">Assigned</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Investigation Scope / Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Detailed targets, jurisdiction requirements, registries to inspect, etc."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Internal Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Internal Case Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="Confidential notes, billing instructions, client contact preferences..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Form Actions */}
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
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-brand-600/30 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Job
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
