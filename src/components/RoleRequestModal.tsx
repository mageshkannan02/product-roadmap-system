import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';

interface RoleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedRole: 'Admin' | 'Product Manager' | 'Team Member';
}

export function RoleRequestModal({ isOpen, onClose, requestedRole }: RoleRequestModalProps) {
  const { requestRole } = useAuth();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Please provide a reason.');

    setIsSubmitting(true);
    try {
      await requestRole(requestedRole, description);
      toast.success('Role request sent for approval!');
      onClose();
      setDescription('');
    } catch {
      toast.error('Failed to send request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Requesting {requestedRole} Role</h3>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Why do you need this role?
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your need for elevated permissions..."
                  className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-3.5 transition-colors resize-none"
                />
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Your request will be sent to the current Administrators and Product Managers for review.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
