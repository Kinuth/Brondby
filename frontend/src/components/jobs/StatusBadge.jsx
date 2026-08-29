import React from 'react';

const STATUS_STYLES = {
  incoming: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    label: 'Incoming',
  },
  assigned: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    label: 'Assigned',
  },
  pending: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Pending',
  },
  completed: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Cancelled',
  },
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const current = STATUS_STYLES[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : size === 'lg' 
    ? 'px-3 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} shadow-2xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};
