import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { ItemNotes } from './ItemNotes';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'Feature' | 'Task';
  entityId: number;
  entityTitle: string;
}

export const NotesModal: React.FC<NotesModalProps> = ({ 
  isOpen, 
  onClose, 
  entityType, 
  entityId, 
  entityTitle 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-200/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {entityType} Discussion
                  </h2>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[300px]">
                    {entityTitle}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all shadow-none!"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes List and Input */}
            <div className="h-[600px] flex flex-col">
              <ItemNotes 
                featureId={entityType === 'Feature' ? entityId : undefined} 
                taskId={entityType === 'Task' ? entityId : undefined} 
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
