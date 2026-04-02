import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Check, X, Shield, Clock, User as UserIcon, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn, formatUserName } from '../lib/utils';

interface RoleRequest {
  id: number;
  user_id: number;
  requested_role: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminRequests() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionId, setRejectionId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await api.get('/api/auth/role-requests/pending', token);
      setRequests(data);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id: number, status: 'Approved' | 'Rejected', reason?: string) => {
    setIsSubmitting(true);
    try {
      await api.put(`/api/auth/role-requests/${id}`, { status, rejection_reason: reason }, token);
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setRequests(requests.filter(r => r.id !== id));
      setRejectionId(null);
      setRejectionReason('');
    } catch {
      toast.error('Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-full space-y-4 pr-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Role Approvals</h2>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Elevated Permission Queue</p>
        </div>
        <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
          {requests.length} Pending
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {requests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center"
          >
            <Clock className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">All caught up!</h3>
            <p className="text-gray-400 text-[11px] mt-1">No pending role requests at the moment.</p>
          </motion.div>
        ) : (
          <div className="grid gap-2">
            {requests.map((request) => (
              <motion.div
                layout
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <UserIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900 leading-none">{formatUserName(request.user, user?.id)}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {request.user.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">{request.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2 mr-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">
                          TO {request.requested_role}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecision(request.id, 'Approved')}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-black uppercase hover:bg-emerald-100 transition-colors border border-emerald-100 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectionId(request.id)}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-black uppercase hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-start gap-3">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700 leading-relaxed italic">"{request.description}"</p>
                      <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {format(new Date(request.createdAt), 'PPP p')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionId(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-50 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Reject Request</h3>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Reason Required</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for the requester..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:ring-1 focus:ring-rose-200 focus:border-rose-500 min-h-[120px] outline-none transition-all shadow-sm"
                    autoFocus
                  />
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRejectionId(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-all border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDecision(rejectionId, 'Rejected', rejectionReason)}
                      disabled={!rejectionReason.trim() || isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
