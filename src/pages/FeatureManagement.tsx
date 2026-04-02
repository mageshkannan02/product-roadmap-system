import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, X, Search, Filter, FolderGit2, Clock, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { EntityHoverCard } from '../components/EntityHoverCard';
import { NotesModal } from '../components/NotesModal';
import toast from 'react-hot-toast';
import { HistoryModal } from '../components/HistoryModal';
import { StatusChangeModal } from '../components/StatusChangeModal';
import { CustomDropdown } from '../components/CustomDropdown';
import { formatUserName } from '../lib/utils';
export function FeatureManagement() {
  const { user, token } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [roadmapSearches, setRoadmapSearches] = useState<Record<number, string>>({});
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSelectedAssignees([]);
    setRoadmapSearches({});
  };

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyFeatureId, setHistoryFeatureId] = useState<number>(0);
  const [historyFeatureTitle, setHistoryFeatureTitle] = useState('');

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesFeatureId, setNotesFeatureId] = useState<number>(0);
  const [notesFeatureTitle, setNotesFeatureTitle] = useState('');

  // Status Change State
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; title: string; oldStatus: string; newStatus: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [roadmapId, setRoadmapId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);

  const fetchRoadmaps = async () => {
    try {
      const data = await api.get('/api/roadmaps', token);
      setRoadmaps(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/users', token);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRoadmaps();
      fetchUsers();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      roadmap_id: parseInt(roadmapId),
      priority,
      deadline: deadline ? deadline : null,
      assignees: assignees.map(id => parseInt(id))
    };
    try {
      if (editingFeature) {
        await api.put(`/api/features/${editingFeature.id}`, payload, token);
        toast.success('Feature updated!');
      } else {
        await api.post('/api/features', payload, token);
        toast.success('Feature created!');
      }
      closeModal();
      fetchRoadmaps();
    } catch (err) {
      console.error(err);
      toast.error(editingFeature ? 'Failed to update feature.' : 'Failed to create feature.');
    }
  };

  const updateFeatureStatus = async (featureId: number, status: string, description?: string) => {
    try {
      await api.put(`/api/features/${featureId}`, { status, description }, token);
      toast.success('Feature status updated!');
      fetchRoadmaps();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update feature status');
    }
  };

  const openEdit = (f: any) => {
    setEditingFeature(f);
    setTitle(f.title);
    setRoadmapId(String(f.roadmap_id));
    setPriority(f.priority);
    setDeadline(f.deadline ? f.deadline.split('T')[0] : '');
    setAssignees((f.assignees || []).map((a: any) => String(a.id)));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFeature(null);
    setTitle(''); setRoadmapId(''); setPriority('Medium'); setDeadline(''); setAssignees([]);
  };

  const handleDeleteFeature = async (featureId: number, featureTitle: string) => {
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span>Delete <strong>{featureTitle}</strong>?</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/api/features/${featureId}`, token);
                toast.success('Feature deleted.');
                fetchRoadmaps();
              } catch { toast.error('Failed to delete feature.'); }
            }}
            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
          >Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200">Cancel</button>
        </span>
      ),
      { duration: 8000 }
    );
  };

  const openHistory = (featureId: number, title: string) => {
    setHistoryFeatureId(featureId);
    setHistoryFeatureTitle(title);
    setHistoryModalOpen(true);
  };

  const openNotes = (featureId: number, title: string) => {
    setNotesFeatureId(featureId);
    setNotesFeatureTitle(title);
    setNotesModalOpen(true);
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Product Manager';

  // Apply filters to roadmaps
  const filteredRoadmaps = roadmaps.map(roadmap => {
    const filteredFeatures = (roadmap.features || []).filter((f: any) => {
      const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            roadmap.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || f.priority === priorityFilter;
      const matchesAssignee = selectedAssignees.length === 0 || 
                              (f.assignees || []).some((a: any) => selectedAssignees.includes(String(a.id)));
      
      // Project-specific search
      const localSearch = roadmapSearches[roadmap.id] || '';
      const matchesLocal = !localSearch || f.title.toLowerCase().includes(localSearch.toLowerCase());

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesLocal;
    });
    return { ...roadmap, filteredFeatures };
  }).filter(roadmap => roadmap.filteredFeatures.length > 0 || roadmap.id.toString() === roadmapId || (roadmapSearches[roadmap.id] && roadmapSearches[roadmap.id] !== ''));

  // For display, we only want to show roadmaps that actually have features matching the criteria,
  // unless we are clearing all filters.
  const displayRoadmaps = filteredRoadmaps.filter(r => r.filteredFeatures.length > 0 || (roadmapSearches[r.id] && roadmapSearches[r.id] !== ''));
  const isFiltering = searchTerm !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || selectedAssignees.length > 0 || Object.values(roadmapSearches).some(s => s !== '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feature Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track product deliverables grouped by project</p>
        </div>
        <div className="flex items-center gap-3">
          {isFiltering && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors">
              <Plus className="w-3.5 h-3.5 rotate-45" /> Clear Filters
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Feature
            </button>
          )}
        </div>
      </div>

      {/* Standardized Filters Grid */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search features..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          
          {/* Status Filter */}
          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Planned', label: 'Planned' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Blocked', label: 'Blocked' },
              { value: 'Completed', label: 'Completed' }
            ]}
            prefixIcon={<Filter className="w-4 h-4" />}
            className="w-full"
          />

          {/* Priority Filter */}
          <CustomDropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'All', label: 'All Priorities' },
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Critical', label: 'Critical' }
            ]}
            prefixIcon={<Clock className="w-4 h-4" />}
            className="w-full"
          />

          {/* Assignee Filter (Multi-select) */}
          <div className="relative space-y-2">
            <CustomDropdown
              isMulti
              selectedValues={selectedAssignees}
              onMultiChange={setSelectedAssignees}
              options={users.map((u: any) => ({
                value: String(u.id),
                label: u.name
              }))}
              prefixIcon={<FolderGit2 className="w-4 h-4" />}
              className="w-full"
              placeholder="Filter by assignee..."
            />
            {/* Selected Assignee Chips */}
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedAssignees.map(id => {
                  const u = users.find(user => String(user.id) === String(id));
                  if (!u) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-[10px] font-bold shadow-sm group hover:bg-indigo-100 transition-colors"
                    >
                      {u.name}
                      <button
                        onClick={() => setSelectedAssignees(prev => prev.filter(p => p !== id))}
                        className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-8">
        {displayRoadmaps.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <FolderGit2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No features found</p>
            <p className="mt-1">{isFiltering ? "Try adjusting your filters or search terms." : "Create a feature to get started!"}</p>
          </div>
        ) : (
          displayRoadmaps.map(roadmap => (
            <div key={roadmap.id} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <FolderGit2 className="w-5 h-5 text-indigo-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{roadmap.title}</h2>
                  
                  {/* Local Project Search */}
                  <div className="relative group/lsearch ml-4">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/lsearch:text-indigo-500 transition-colors pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Filter features..."
                      value={roadmapSearches[roadmap.id] || ''}
                      onChange={(e) => setRoadmapSearches(prev => ({ ...prev, [roadmap.id]: e.target.value }))}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none w-48 transition-all font-medium"
                    />
                  </div>
                </div>
                <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {roadmap.filteredFeatures.length} Feature{roadmap.filteredFeatures.length !== 1 && 's'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Feature</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white w-48">Assignees</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white w-32">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white w-24">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white w-32">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {roadmap.filteredFeatures.map((f: any) => {
                      const isOverdue = f.deadline && new Date(f.deadline) < new Date() && f.status !== 'Completed';
                      return (
                        <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <EntityHoverCard 
                              creator={f.creator} 
                              createdAt={f.created_at} 
                              type="Feature"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {f.title}
                                </span>
                                <span className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium">
                                  {f.description || 'No description provided'}
                                </span>
                              </div>
                            </EntityHoverCard>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex -space-x-2 overflow-hidden">
                              {f.assignees?.map((a: any) => (
                                <div key={a.id} className="h-8 w-8 rounded-full ring-2 ring-white bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm" title={formatUserName(a, user?.id)}>
                                  {a.name.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {(!f.assignees || f.assignees.length === 0) && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">Unassigned</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium tracking-tight">
                            {f.deadline ? new Date(f.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-bold uppercase tracking-wider rounded-md border ${
                              f.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              f.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              f.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {f.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <CustomDropdown
                                  value={f.status}
                                  onChange={(newStatus) => {
                                    if (newStatus !== f.status) {
                                      setPendingStatusChange({
                                        id: f.id,
                                        title: f.title,
                                        oldStatus: f.status,
                                        newStatus
                                      });
                                    }
                                  }}
                                  options={[
                                    { value: 'Planned', label: 'Planned', colorClass: 'font-semibold text-gray-700' },
                                    { value: 'In Progress', label: 'In Progress', colorClass: 'font-semibold text-blue-600' },
                                    { value: 'Blocked', label: 'Blocked', colorClass: 'font-semibold text-red-600' },
                                    { value: 'Completed', label: 'Completed', colorClass: 'font-semibold text-emerald-600' }
                                  ]}
                                  wrapperClassName="w-[125px]"
                                  className={`w-full px-2.5 py-1 h-7 text-[11px] uppercase tracking-wider font-bold rounded-md shadow-none border focus:ring-indigo-500 transition-colors ${
                                    f.status === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                    f.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                    f.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                    'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                  }`}
                                />
                              {isOverdue && f.status !== 'Completed' && (
                                <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 shadow-sm animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openHistory(f.id, f.title)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50"
                                title="View History"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openNotes(f.id, f.title)}
                                className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-md hover:bg-emerald-50"
                                title="Discussion & Notes"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => openEdit(f)}
                                    className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 rounded-md hover:bg-amber-50"
                                    title="Edit Feature"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFeature(f.id, f.title)}
                                    className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
                                    title="Delete Feature"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={closeModal} style={{ zIndex: 0 }}></div>
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{editingFeature ? 'Edit Feature' : 'Create New Feature'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                />
              </div>
              <div>
                <CustomDropdown
                  value={roadmapId}
                  onChange={val => { setRoadmapId(val); setAssignees([]); }}
                  options={[
                    { value: '', label: 'Select a project...' },
                    ...roadmaps.map(r => ({ value: String(r.id), label: r.title }))
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <CustomDropdown
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: 'Low', label: 'Low', colorClass: 'text-emerald-600 font-semibold' },
                    { value: 'Medium', label: 'Medium', colorClass: 'text-blue-600 font-semibold' },
                    { value: 'High', label: 'High', colorClass: 'text-orange-600 font-semibold' },
                    { value: 'Critical', label: 'Critical', colorClass: 'text-red-600 font-semibold' }
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assignees</label>
                {!roadmapId ? (
                  <p className="text-xs text-gray-400 italic p-2 border border-dashed border-gray-200 rounded-lg">Select a project first to assign users.</p>
                ) : (() => {
                    const sorted = [...users].sort((a, b) => (String(a.id) == String(user?.id) ? 1 : String(b.id) == String(user?.id) ? -1 : 0));
                    const uniqueByEmail = Array.from(new Map(sorted.map((u: any) => [u.email, u])).values());
                    const availableForAssign = uniqueByEmail.filter((u: any) => !assignees.includes(u.id.toString()));
                    return (
                      <>
                        {uniqueByEmail.length === 0 ? (
                          <p className="text-xs text-amber-600 italic p-2 border border-dashed border-amber-200 rounded-lg bg-amber-50">No users available to assign.</p>
                        ) : (
                          <CustomDropdown
                            value=""
                            onChange={(val) => {
                              if (val && !assignees.includes(val)) {
                                setAssignees(prev => [...prev, val]);
                              }
                            }}
                            options={[
                              { value: '', label: 'Select a user to assign...' },
                              ...availableForAssign.map((u: any) => ({
                                value: String(u.id),
                                label: String(u.id) == String(user?.id) ? formatUserName(u, user?.id) : `${u.name} (${u.role})`
                              }))
                            ]}
                            placeholder="Select a user to assign..."
                            className="w-full mb-3"
                          />
                        )}
                      </>
                    );
                })()}
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignees.map(id => {
                    const member = users.find((u: any) => u.id.toString() === id);
                    if (!member) return null;
                    return (
                      <span key={id} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                        {formatUserName(member, user?.id)}
                        <button
                          type="button"
                          onClick={() => setAssignees(prev => prev.filter(a => a !== id))}
                          className="shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-300 hover:text-indigo-800 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold shadow-sm transition-colors"
                >
                  Create Feature
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      <HistoryModal 
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        entityType="Feature"
        entityId={historyFeatureId}
        entityTitle={historyFeatureTitle}
      />

      {pendingStatusChange && (
        <StatusChangeModal
          isOpen={!!pendingStatusChange}
          onClose={() => setPendingStatusChange(null)}
          onConfirm={(description) => {
            updateFeatureStatus(pendingStatusChange.id, pendingStatusChange.newStatus, description);
            setPendingStatusChange(null);
          }}
          entityTitle={pendingStatusChange.title}
          oldStatus={pendingStatusChange.oldStatus}
          newStatus={pendingStatusChange.newStatus}
        />
      )}

      <NotesModal 
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        entityType="Feature"
        entityId={notesFeatureId}
        entityTitle={notesFeatureTitle}
      />
    </div>
  );
}
