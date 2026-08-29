import React from 'react';

const STATUS_STYLES = {
  incoming: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
    label: 'Incoming',
  },
  assigned: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    label: 'Assigned',
  },
  pending: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400 animate-pulse',
    label: 'Pending',
  },
  completed: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Cancelled',
  },
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const current = STATUS_STYLES[status] || {
    bg: 'bg-slate-700 text-slate-300 border-slate-600',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'lg' 
    ? 'px-3 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} shadow-sm backdrop-blur-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};
