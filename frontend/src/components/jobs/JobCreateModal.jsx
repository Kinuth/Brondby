import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import apiClient from '../../api/client';
import { 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  UserPlus, 
  Paperclip, 
  X, 
  Check, 
  Building2, 
  FileText 
} from 'lucide-react';

export const JobCreateModal = ({ isOpen, onClose, onSuccess, clients = [], services = [], workers = [] }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client: '',
    service_type: '',
    assigned_worker: '',
    status: 'incoming',
    due_date: '',
    description: '',
    notes: '',
  });

  // Inline Client Registration State
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [savingClient, setSavingClient] = useState(false);
  const [clientError, setClientError] = useState('');
  const [localClients, setLocalClients] = useState(clients);

  // Synchronize localClients when prop changes
  React.useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  // Staged File Attachments
  const [stagedFiles, setStagedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'assigned_worker' && value && prev.status === 'incoming') {
        updated.status = 'assigned';
      }
      return updated;
    });
  };

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientData((prev) => ({ ...prev, [name]: value }));
  };

  // Register New Client Inline
  const handleRegisterClientInline = async (e) => {
    e.preventDefault();
    if (!newClientData.name.trim()) {
      setClientError('Client name is required.');
      return;
    }

    setSavingClient(true);
    setClientError('');

    try {
      const res = await apiClient.post('/clients/', newClientData);
      const createdClient = res.data;

      // Invalidate queries so the new client shows under Clients tab immediately
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients_list'] });

      // Add to local list and select
      setLocalClients((prev) => [createdClient, ...prev]);
      setFormData((prev) => ({ ...prev, client: createdClient.id }));

      // Reset inline form
      setNewClientData({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
      });
      setShowNewClientForm(false);
    } catch (err) {
      console.error('Failed to register client inline:', err);
      const errMsg = err.response?.data?.name?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to register new client.';
      setClientError(errMsg);
    } finally {
      setSavingClient(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setStagedFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleRemoveFile = (index) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Submit Job and Upload Attachments
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client) {
      setError('Please select or register a client for this case.');
      return;
    }
    if (!formData.service_type) {
      setError('Please select a service type.');
      return;
    }

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
        status_note: 'Initial case entry created by Admin.',
      };

      const res = await apiClient.post('/jobs/', payload);
      const createdJob = res.data;

      // Upload any staged attachments to the newly created job
      if (stagedFiles.length > 0) {
        for (const file of stagedFiles) {
          const uploadData = new FormData();
          uploadData.append('file', file);
          uploadData.append('description', 'Initial briefing attachment');
          try {
            await apiClient.post(`/jobs/${createdJob.id}/upload_attachment/`, uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (fileErr) {
            console.error(`Failed to upload attachment ${file.name}:`, fileErr);
          }
        }
      }

      onSuccess?.();
      onClose();

      // Reset form state
      setFormData({
        client: '',
        service_type: '',
        assigned_worker: '',
        status: 'incoming',
        due_date: '',
        description: '',
        notes: '',
      });
      setStagedFiles([]);
    } catch (err) {
      console.error('Failed to create job:', err);
      const errMsg = err.response?.data?.client?.[0] || 
                     err.response?.data?.service_type?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to create case. Please verify all required fields.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Investigation Case" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Client & Service Selection */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Client <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showNewClientForm ? 'Cancel New Client' : '+ Register New Client'}</span>
                </button>
              </div>

              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                required={!showNewClientForm}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select Existing Client --</option>
                {localClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Service Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select Investigation Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================================================================
              INLINE NEW CLIENT REGISTRATION CARD
             ========================================================================= */}
          {showNewClientForm && (
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-brand-200/50 pb-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                    Register New Client (Will automatically show in Clients tab)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {clientError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{clientError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Client / Contact Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newClientData.name}
                    onChange={handleNewClientChange}
                    placeholder="Full Contact Name"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={newClientData.company_name}
                    onChange={handleNewClientChange}
                    placeholder="Corporate Entity / Chambers"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={newClientData.email}
                    onChange={handleNewClientChange}
                    placeholder="contact@client.africa"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newClientData.phone}
                    onChange={handleNewClientChange}
                    placeholder="+254 700 000 000"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Registered Office / Address</label>
                <input
                  type="text"
                  name="address"
                  value={newClientData.address}
                  onChange={handleNewClientChange}
                  placeholder="Street, City, Country"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleRegisterClientInline}
                  disabled={savingClient}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  {savingClient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Registering Client...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Select Client
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Worker, Status, and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assign Investigator
            </label>
            <select
              name="assigned_worker"
              value={formData.assigned_worker}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Leave Unassigned --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name || w.username}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Initial Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="incoming">Incoming</option>
              <option value="assigned">Assigned</option>
              <option value="pending">Pending / In-Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Scope & Internal Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Investigation Scope / Instructions
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Target corporate entity, jurisdictions, registry searches, litigation history to review..."
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Internal Case Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Confidential notes, billing specifications, special client instructions..."
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* =========================================================================
            TASK ATTACHMENTS & BRIEFING DOCUMENTS
           ========================================================================= */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-brand-600" />
              <span>Attach Initial Briefing Documents & Evidence (Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">PDF, PNG, JPG, DOCX, CSV</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Choose Files to Attach</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-500">
              {stagedFiles.length === 0 ? 'No files selected' : `${stagedFiles.length} file(s) ready to upload`}
            </span>
          </div>

          {/* Staged files preview list */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {stagedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  <span className="font-medium max-w-[180px] truncate">{file.name}</span>
                  <span className="text-slate-400 text-[10px]">({formatFileSize(file.size)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Case & Uploading...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Investigation Case
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
