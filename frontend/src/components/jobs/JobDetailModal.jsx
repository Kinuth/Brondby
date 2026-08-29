import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  History, 
  ArrowRight,
  Paperclip,
  Download,
  Trash2,
  UploadCloud,
  Loader2,
  File,
  FileSpreadsheet,
  FileImage,
  AlertCircle
} from 'lucide-react';

export const JobDetailModal = ({ isOpen, onClose, job, onOpenStatusUpdate }) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [description, setDescription] = useState('');

  if (!job) return null;

  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-indigo-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Upload attachment directly to this job
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description || 'Case documentation');

      await apiClient.post(`/jobs/${job.id}/upload_attachment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Refetch job list to update attachments
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setDescription('');
    } catch (err) {
      console.error('Failed to upload file:', err);
      setUploadError(err.response?.data?.file?.[0] || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this case attachment permanently?')) return;

    try {
      await apiClient.delete(`/attachments/${attachmentId}/`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      alert('Failed to delete attachment.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Case #${job.id} — ${job.service_type_detail?.name}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Current Status</span>
            <div>
              <StatusBadge status={job.status} size="lg" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Due Date</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-brand-600" />
              {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'No deadline set'}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Assigned Investigator</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <User className="w-4 h-4 text-purple-600" />
              {job.assigned_worker_detail?.full_name || job.assigned_worker_detail?.username || (
                <span className="text-amber-600 font-normal italic">Unassigned</span>
              )}
            </div>
          </div>
          {onOpenStatusUpdate && (
            <button
              onClick={() => {
                onClose();
                onOpenStatusUpdate(job);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition self-center"
            >
              Update Status
            </button>
          )}
        </div>

        {/* Client & Service Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Building2 className="w-4 h-4 text-brand-600" />
              Client Information
            </div>
            <p className="text-base font-bold text-slate-900">{job.client_detail?.name}</p>
            {job.client_detail?.company_name && (
              <p className="text-xs text-brand-700 font-medium">{job.client_detail.company_name}</p>
            )}
            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              {job.client_detail?.email && <p>Email: {job.client_detail.email}</p>}
              {job.client_detail?.phone && <p>Phone: {job.client_detail.phone}</p>}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <FileText className="w-4 h-4 text-brand-600" />
              Service Specifications
            </div>
            <p className="text-sm font-semibold text-slate-900">{job.service_type_detail?.name}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {job.service_type_detail?.description}
            </p>
          </div>
        </div>

        {/* Description & Notes */}
        <div className="space-y-4">
          {job.description && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Case Scope / Instructions</label>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          )}

          {job.notes && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Internal Case Notes</label>
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                {job.notes}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            TASK ATTACHMENTS & EVIDENCE REPOSITORY
           ========================================================================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Paperclip className="w-4 h-4 text-brand-600" />
              <span>Documents & Attachments ({job.attachments?.length || 0})</span>
            </div>
            <span className="text-[11px] text-slate-400">Organized case file records</span>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Existing Attachments List */}
          {(!job.attachments || job.attachments.length === 0) ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              No files or evidence documents attached to this case yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              {job.attachments.map((att) => (
                <div key={att.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                      {getFileIcon(att.file_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {att.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{formatFileSize(att.file_size)}</span>
                        <span>•</span>
                        <span>Uploaded by {att.uploaded_by_name}</span>
                        <span>•</span>
                        <span>{new Date(att.created_at).toLocaleDateString()}</span>
                      </div>
                      {att.description && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5 truncate">
                          "{att.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={att.file_url || att.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-700 transition"
                      title="Download / View Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {(isAdmin || att.uploaded_by === user?.id) && (
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Upload Bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional document label (e.g. Official Registry Extract, Certificate #123)..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition">
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </>
              )}
              <input
                type="file"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Audit Trail Timeline */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
            <History className="w-4 h-4 text-brand-600" />
            Audit History & Status Progression ({job.status_logs?.length || 0} entries)
          </div>

          {(!job.status_logs || job.status_logs.length === 0) ? (
            <p className="text-xs text-slate-400 italic py-2">No status changes recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {job.status_logs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{log.changed_by_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">{log.old_status}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <StatusBadge status={log.new_status} size="xs" />
                      </div>
                    </div>
                    {log.note && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                        "{log.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
