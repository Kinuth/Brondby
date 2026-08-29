import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from './StatusBadge';
import { 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  History, 
  ArrowRight
} from 'lucide-react';

export const JobDetailModal = ({ isOpen, onClose, job, onOpenStatusUpdate }) => {
  if (!job) return null;

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
