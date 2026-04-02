import React, { useState } from 'react';
import { X, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (description: string) => void;
  entityTitle: string;
  oldStatus: string;
  newStatus: string;
}

export function StatusChangeModal({ isOpen, onClose, onConfirm, entityTitle, oldStatus, newStatus }: StatusChangeModalProps) {
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(description);
    setDescription('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Update Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">
                    {entityTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5 flex-1">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-semibold text-gray-500">Changing status:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-white border border-gray-200 shadow-sm">{oldStatus}</span>
                  <span className="text-gray-400 text-sm">→</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-white border border-gray-200 shadow-sm text-indigo-700">{newStatus}</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Add a comment <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Why is the status changing?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm p-3 transition-colors resize-none placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Update Status
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
