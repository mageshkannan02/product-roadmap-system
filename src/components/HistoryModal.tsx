import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { X, Clock, Loader2, ArrowRight, History, PlusCircle, Trash2, RefreshCw, Info } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'Feature' | 'Task';
  entityId: number;
  entityTitle: string;
}

interface ActivityLog {
  id: number;
  action: 'created' | 'status_change' | 'deleted';
  old_status: string | null;
  new_status: string | null;
  description: string | null;
  createdAt: string;
  user: { id: number; name: string };
}

const statusChip = (status: string | null) => {
  if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
  switch (status) {
    case 'Completed':
    case 'Done':       return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Blocked':    return 'bg-red-50 text-red-700 border-red-200';
    case 'In Progress':return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Review':     return 'bg-amber-50 text-amber-700 border-amber-200';
    default:           return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const avatarGradient = (name: string) => {
  const g = ['from-violet-500 to-indigo-500', 'from-pink-500 to-rose-400', 'from-cyan-500 to-blue-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'];
  return g[(name?.charCodeAt(0) || 0) % g.length];
};

const actionMeta = (action: ActivityLog['action']) => {
  switch (action) {
    case 'created': return { icon: PlusCircle, label: 'Created', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    case 'deleted': return { icon: Trash2,    label: 'Deleted', color: 'text-red-600',    bg: 'bg-red-50 border-red-200' };
    default:        return { icon: RefreshCw, label: 'Status changed', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
  }
};

function LogItem({ log }: { log: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);
  const meta = actionMeta(log.action);
  const ActionIcon = meta.icon;

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white bg-linear-to-br ${avatarGradient(log.user?.name)} shadow-sm ring-4 ring-white z-10`}>
        {log.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      {/* Card */}
      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{log.user?.name || 'Unknown User'}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${meta.bg} ${meta.color}`}>
              <ActionIcon className="w-2.5 h-2.5" />
              {meta.label}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap flex items-center gap-1 pt-px">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Status transition — show for status_change OR legacy null action */}
        {(log.action === 'status_change' || !log.action) && log.old_status && log.new_status && (
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[11px] text-gray-500 font-medium mr-1">Changed from</span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${statusChip(log.old_status)}`}>{log.old_status}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${statusChip(log.new_status)}`}>{log.new_status}</span>
          </div>
        )}

        {/* Created event: show initial status */}
        {log.action === 'created' && log.new_status && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Initial status:</span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${statusChip(log.new_status)}`}>{log.new_status}</span>
          </div>
        )}

        {/* Deleted event: show last known status */}
        {log.action === 'deleted' && log.old_status && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Last status:</span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${statusChip(log.old_status)}`}>{log.old_status}</span>
          </div>
        )}

        {log.description && (
          <div className="mt-2 mb-2">
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 px-2 py-1 rounded-md transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              {expanded ? 'Hide Details' : 'View Details'}
            </button>
            {expanded && (
              <div className="mt-3 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 wrap-break-word shadow-sm animate-in fade-in slide-in-from-top-1">
                <p className="whitespace-pre-wrap leading-relaxed">{log.description}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-1">
          {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  );
}

export function HistoryModal({ isOpen, onClose, entityType, entityId, entityTitle }: HistoryModalProps) {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      api.get(`/api/logs/${entityType}/${entityId}`, token)
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, entityType, entityId, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Activity History</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">
                <span className="text-gray-300">{entityType} /</span> {entityTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-400 font-medium">Loading history…</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-gray-300" />
              </div>
              <h4 className="text-gray-800 font-semibold">No activity yet</h4>
              <p className="text-sm text-gray-400 mt-1">Actions for this {entityType.toLowerCase()} will appear here.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline track */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-linear-to-b from-indigo-200 via-gray-200 to-transparent" />
              <div className="space-y-4">
                {logs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {!loading && `${logs.length} event${logs.length !== 1 ? 's' : ''} recorded`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
