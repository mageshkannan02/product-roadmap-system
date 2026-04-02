import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { UserPlus, X, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatUserName } from '../lib/utils';

interface MemberManagerProps {
  roadmapId: number;
  roadmapTitle: string;
  members: any[];
  allUsers: any[];
  onClose: () => void;
  onMembersChanged: (members: any[]) => void;
}

export function MemberManager({ roadmapId, roadmapTitle, members, allUsers, onClose, onMembersChanged }: MemberManagerProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const memberIds = new Set(members.map((m: any) => m.id));
  const availableUsers = allUsers.filter((u: any) => !memberIds.has(u.id) &&
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (user: any) => {
    setLoading(user.id);
    try {
      const updated = await api.post(`/api/roadmaps/${roadmapId}/members`, { userId: user.id }, token);
      onMembersChanged(updated);
      toast.success(`${user.name} added to project`);
    } catch {
      toast.error('Failed to add member');
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (user: any) => {
    setLoading(user.id);
    try {
      await api.delete(`/api/roadmaps/${roadmapId}/members/${user.id}`, token);
      onMembersChanged(members.filter((m: any) => m.id !== user.id));
      toast.success(`${user.name} removed from project`);
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setLoading(null);
    }
  };

  const roleColor = (role: string) => {
    if (role === 'Admin') return 'bg-red-100 text-red-700';
    if (role === 'Product Manager') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Manage Members</h2>
                <p className="text-xs text-gray-500 truncate max-w-[240px]">{roadmapTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Current Members */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Current Members ({members.length})
              </h3>
              {members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">No members added yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{formatUserName(m, user?.id)}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleColor(m.role)}`}>{m.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(m)}
                        disabled={loading === m.id}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        {loading === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Members */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Members</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              />
              {availableUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {searchTerm ? 'No users match your search.' : 'All users are already members.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{formatUserName(u, user?.id)}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleColor(u.role)}`}>{u.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(u)}
                        disabled={loading === u.id}
                        className="p-1.5 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Add to project"
                      >
                        {loading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
