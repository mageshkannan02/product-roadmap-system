import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Clock, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, CheckCircle2, Users, Zap, MessageSquare, Layout, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { EntityHoverCard } from '../components/EntityHoverCard';
import { NotesModal } from '../components/NotesModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HistoryModal } from '../components/HistoryModal';
import { StatusChangeModal } from '../components/StatusChangeModal';
import { CustomDropdown } from '../components/CustomDropdown';
import { formatUserName } from '../lib/utils';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  'To Do':       { label: 'To Do',       pill: 'bg-slate-100 text-slate-600 border border-slate-200',        dot: 'bg-slate-400'   },
  'In Progress': { label: 'In Progress', pill: 'bg-violet-100 text-violet-700 border border-violet-200',      dot: 'bg-violet-500'  },
  'Review':      { label: 'Review',      pill: 'bg-amber-100 text-amber-700 border border-amber-200',         dot: 'bg-amber-500'   },
  'Done':        { label: 'Done',        pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200',   dot: 'bg-emerald-500' },
};

const FEATURE_STATUS: Record<string, string> = {
  'Planned':     'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-violet-100 text-violet-700 border-violet-200',
  'Blocked':     'bg-rose-100 text-rose-700 border-rose-200',
  'Completed':   'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'text-rose-500',
  High:     'text-orange-500',
  Medium:   'text-violet-500',
  Low:      'text-slate-400',
};

export function TaskTracking() {
  const { user, token } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedFeatures, setCollapsedFeatures] = useState<Set<number>>(new Set());
  const [collapsedRoadmaps, setCollapsedRoadmaps] = useState<Set<number>>(new Set());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('none'); // 'none' | 'assignee'

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [preselectedFeatureId, setPreselectedFeatureId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<number>(0);
  const [historyTaskTitle, setHistoryTaskTitle] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; title: string; oldStatus: string; newStatus: string } | null>(null);

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesEntityId, setNotesEntityId] = useState<number>(0);
  const [notesEntityType, setNotesEntityType] = useState<'Feature' | 'Task'>('Feature');
  const [notesEntityTitle, setNotesEntityTitle] = useState('');

  const fetchData = async () => {
    try {
      const [roadmapsData, usersData] = await Promise.all([
        api.get('/api/roadmaps', token),
        api.get('/api/users', token),
      ]);
      setRoadmaps(roadmapsData);
      setUsers(usersData);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const openAddTask = (fId: number) => {
    setEditingTask(null); setTitle(''); setFeatureId(String(fId));
    setPreselectedFeatureId(fId); setAssignedUserId(''); setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditingTask(t); setTitle(t.title); setFeatureId(String(t.feature_id || ''));
    setPreselectedFeatureId(null); setAssignedUserId(String(t.assigned_user_id || '')); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingTask(null);
    setTitle(''); setFeatureId(''); setAssignedUserId(''); setPreselectedFeatureId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title, feature_id: parseInt(featureId), assigned_user_id: assignedUserId ? parseInt(assignedUserId) : null };
    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, payload, token);
        toast.success('Task updated!');
      } else {
        await api.post('/api/tasks', payload, token);
        toast.success('Task created!');
      }
      closeModal(); fetchData();
    } catch { toast.error('Failed to save task.'); }
  };

  const updateTaskStatus = async (taskId: number, status: string, description?: string) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status, description }, token);
      if (status === 'Done') toast.success('Task done! Checking feature completion…');
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Delete this task?')) {
      try { await api.delete(`/api/tasks/${taskId}`, token); toast.success('Deleted.'); fetchData(); }
      catch { toast.error('Failed to delete.'); }
    }
  };

  const toggleRoadmap = (id: number) => setCollapsedRoadmaps(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const toggleFeature = (id: number) => setCollapsedFeatures(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSelectedAssignees([]);
    setSortBy('none');
  };

  const openNotes = (type: 'Feature' | 'Task', id: number, title: string) => {
    setNotesEntityType(type);
    setNotesEntityId(id);
    setNotesEntityTitle(title);
    setNotesModalOpen(true);
  };

  const canManage = user?.role !== 'Team Member';

  const getMembersForFeature = (fId: string) => {
    // Unique users by email, prioritizing the record that matches current logged-in user
    const sorted = [...users].sort((a, b) => (String(a.id) == String(user?.id) ? 1 : String(b.id) == String(user?.id) ? -1 : 0));
    const uniqueByEmail = Array.from(new Map(sorted.map((u: any) => [u.email, u])).values());
    return uniqueByEmail;
  };

  // Pre-process all features for the creation modal dropdown
  const allFeatures = roadmaps.flatMap((r: any) =>
    (r.features || []).map((f: any) => ({ ...f, roadmapTitle: r.title, roadmapId: r.id }))
  );

  const [featureSearches, setFeatureSearches] = useState<Record<number, string>>({});
  
  const isFiltering = searchQuery !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || selectedAssignees.length > 0 || Object.values(featureSearches).some(s => s !== '');

  const processedRoadmaps = roadmaps.map((r: any) => {
    const roadmapMatches = searchQuery ? r.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;

    const filteredFeatures = (r.features || []).map((f: any) => {
      const featureMatches = searchQuery ? f.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      let filteredTasks = (f.tasks || []);

      // Mandatory: Team Member Assignment (Always applied)
      if (user?.role === 'Team Member') {
        filteredTasks = filteredTasks.filter((t: any) => t.assigned_user_id === user.id);
      }

      // Global Search
      if (searchQuery && !roadmapMatches && !featureMatches) {
        filteredTasks = filteredTasks.filter((t: any) => 
          t.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Feature-Specific Local Search
      const localSearch = featureSearches[f.id] || '';
      if (localSearch) {
        filteredTasks = filteredTasks.filter((t: any) => 
          t.title.toLowerCase().includes(localSearch.toLowerCase())
        );
      }

      // User: Status
      if (statusFilter !== 'All') {
        filteredTasks = filteredTasks.filter((t: any) => t.status === statusFilter);
      }

      // User: Priority (Filtering based on parent feature's priority)
      if (priorityFilter !== 'All' && f.priority !== priorityFilter) {
        filteredTasks = [];
      }

      // User: Assignee (Multi-select)
      if (selectedAssignees.length > 0) {
        filteredTasks = filteredTasks.filter((t: any) => selectedAssignees.includes(String(t.assigned_user_id)));
      }

      // User: Sort
      if (sortBy === 'assignee') {
        filteredTasks = [...filteredTasks].sort((a, b) => {
          const nameA = a.assignee?.name || 'Unassigned';
          const nameB = b.assignee?.name || 'Unassigned';
          return nameA.localeCompare(nameB);
        });
      }

      return { ...f, tasks: filteredTasks, featureMatches };
    }).filter((f: any) => {
      if (!isFiltering) return true;
      if (roadmapMatches || f.featureMatches) return true;
      return f.tasks.length > 0 || (featureSearches[f.id] && featureSearches[f.id] !== '');
    });

    return { ...r, features: filteredFeatures, roadmapMatches };
  }).filter((r: any) => {
    if (!isFiltering) return true;
    if (r.roadmapMatches) return true;
    return r.features.length > 0;
  });

  const totalFilteredTasks = processedRoadmaps.reduce((acc: number, r: any) => 
    acc + r.features.reduce((facc: number, f: any) => facc + f.tasks.length, 0), 0
  );


  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Board</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track progress across all projects</p>
          </div>
          {isFiltering && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'To Do', label: 'To Do' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Review', label: 'Review' },
                { value: 'Done', label: 'Done' }
              ]}
              prefixIcon={<Filter className="w-4 h-4" />}
              className="w-full"
            />
          </div>

          {/* Priority Filter */}
          <div className="relative">
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
              prefixIcon={<Zap className="w-4 h-4" />}
              className="w-full"
            />
          </div>

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
              prefixIcon={<Users className="w-4 h-4" />}
              className="w-full"
              placeholder="Filter by assignee..."
            />
            {/* Selected Assignee Chips directly under dropdown */}
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedAssignees.map(id => {
                  const u = users.find(user => String(user.id) === String(id));
                  if (!u) return null;
                  return (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
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
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative lg:col-start-4">
            <CustomDropdown
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'none', label: 'No Sorting' },
                { value: 'assignee', label: 'Sort by Assignee' }
              ]}
              prefixIcon={<ArrowUpDown className="w-4 h-4" />}
              className="w-full"
            />
          </div>
        </div>        <div className="flex items-center gap-4 pt-4 border-t border-gray-50 flex-wrap">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-widest min-w-[50px]">Stats:</div>
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 text-slate-600 text-[11px] font-bold shadow-sm whitespace-nowrap">
              {processedRoadmaps.length} project{processedRoadmaps.length !== 1 ? 's' : ''}
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 text-slate-600 text-[11px] font-bold shadow-sm whitespace-nowrap">
              {totalFilteredTasks} task{totalFilteredTasks !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {processedRoadmaps.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Zap className="w-12 h-12 mx-auto mb-4 text-violet-300" />
          <p className="font-semibold text-gray-500">No features yet.</p>
          <p className="text-sm mt-1">Add features to a project to start tracking tasks.</p>
        </div>
      )}

      <div className="space-y-8">
        {processedRoadmaps.map((roadmap: any) => (
          <div key={roadmap.id} className="space-y-4">
            {/* Roadmap Header */}
            <div 
              onClick={() => toggleRoadmap(roadmap.id)}
              className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer group"
            >
              <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                {collapsedRoadmaps.has(roadmap.id) ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{roadmap.title}</h2>
              <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full shadow-sm">
                {roadmap.features.length} feature{roadmap.features.length !== 1 ? 's' : ''}
              </span>
            </div>

            <AnimatePresence initial={false}>
              {!collapsedRoadmaps.has(roadmap.id) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pl-4 border-l-2 border-slate-50 ml-2"
                >
                  {roadmap.features.map((feature: any, fi: number) => {
                    const tasks: any[] = feature.tasks || [];
                    const isCollapsed = collapsedFeatures.has(feature.id);
                    const doneTasks = tasks.filter((t: any) => t.status === 'Done').length;
                    const inProgressTasks = tasks.filter((t: any) => t.status === 'In Progress').length;
                    const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
                    const featureStatusCls = FEATURE_STATUS[feature.status] || FEATURE_STATUS['Planned'];
                    const isCompleted = feature.status === 'Completed';

                    return (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: fi * 0.04 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Feature Header (Same as before but inside Project Group) */}
                        <div
                          onClick={() => toggleFeature(feature.id)}
                          className="flex items-center gap-4 px-5 py-4 cursor-pointer group select-none"
                        >
                          <div className="text-gray-300 group-hover:text-violet-400 transition-colors">
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <EntityHoverCard creator={feature.creator} createdAt={feature.createdAt} type="Feature" key={`fc-${feature.id}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${feature.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : feature.status === 'Blocked' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Layout className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{feature.title}</h3>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{feature.status}</p>
                                  </div>
                                </div>
                              </EntityHoverCard>
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${featureStatusCls}`}>
                                {feature.status}
                              </span>
                              {feature.priority && (
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-gray-100 bg-gray-50 ${PRIORITY_COLORS[feature.priority] || 'text-gray-500'}`}>
                                  {feature.priority}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-2.5">
                              <div className="flex-1 max-w-[180px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-violet-400'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-slate-500">{doneTasks}/{tasks.length}</span>
                              {inProgressTasks > 0 && (
                                <span className="text-[10px] font-medium text-slate-400">{inProgressTasks} in progress</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="relative group/fsearch">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within/fsearch:text-indigo-500 transition-colors pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Filter tasks..."
                                value={featureSearches[feature.id] || ''}
                                onChange={(e) => setFeatureSearches(prev => ({ ...prev, [feature.id]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                className="pl-7 pr-3 py-1.5 text-[11px] bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none w-28 sm:w-36 transition-all font-medium"
                              />
                            </div>
                            {tasks.length > 0 && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 w-7 h-7 flex items-center justify-center rounded-full">
                                {tasks.length}
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openNotes('Feature', feature.id, feature.title); }}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                              title="Feature Discussion"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openAddTask(feature.id); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors border border-gray-200"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Task
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tasks */}
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="border-t border-gray-50"
                            >
                              <div className="divide-y divide-gray-50">
                                {tasks.map((task: any) => {
                                  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG['To Do'];
                                  return (
                                    <div key={task.id}
                                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-50/30 transition-colors group"
                                    >
                                      <CustomDropdown
                                        value={task.status}
                                        onChange={(newStatus) => {
                                          if (newStatus !== task.status) {
                                            setPendingStatusChange({ id: task.id, title: task.title, oldStatus: task.status, newStatus });
                                          }
                                        }}
                                        options={[
                                          { value: 'To Do', label: 'To Do', colorClass: 'font-semibold text-slate-600' },
                                          { value: 'In Progress', label: 'In Progress', colorClass: 'font-semibold text-violet-700' },
                                          { value: 'Review', label: 'Review', colorClass: 'font-semibold text-amber-700' },
                                          { value: 'Done', label: 'Done', colorClass: 'font-semibold text-emerald-700' }
                                        ]}
                                        wrapperClassName="w-[125px]"
                                        className={`w-full px-2.5 py-1 h-7 text-[10px] uppercase tracking-widest font-semibold rounded-md shadow-none! border transition-colors ${sc.pill}`}
                                      />
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                                      <EntityHoverCard creator={task.creator} createdAt={task.createdAt} type="Task" key={`tc-${task.id}`}>
                                        <span className="flex-1 text-sm font-normal text-slate-900 truncate">
                                          {task.title}
                                        </span>
                                      </EntityHoverCard>
                                      <div className="relative group/av shrink-0">
                                        {task.assignee ? (
                                          <>
                                            <div
                                              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
                                              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-help"
                                            >
                                              {task.assignee.name.charAt(0)}
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover/av:opacity-100 group-hover/av:visible transition-all whitespace-nowrap z-20 pointer-events-none">
                                              {formatUserName(task.assignee, user?.id)}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="h-8 w-8 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                            <Users className="w-3.5 h-3.5" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => { setHistoryTaskId(task.id); setHistoryTaskTitle(task.title); setHistoryModalOpen(true); }}
                                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all" title="View History">
                                          <Clock className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openNotes('Task', task.id, task.title)}
                                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all" title="Notes & Discussion">
                                          <MessageSquare className="w-4 h-4" />
                                        </button>
                                        {canManage && (
                                          <>
                                            <button onClick={() => openEdit(task)}
                                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all" title="Edit">
                                              <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteTask(task.id)}
                                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all" title="Delete">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                    <input type="text" required placeholder="e.g. Design login page"
                      value={title} onChange={e => setTitle(e.target.value)}
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm border p-3 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Feature</label>
                    <select required value={featureId}
                      onChange={e => { setFeatureId(e.target.value); setAssignedUserId(''); }}
                      disabled={!!preselectedFeatureId}
                      className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm border p-3 bg-white disabled:bg-gray-50 disabled:text-gray-500 transition-colors">
                      <option value="">Select a feature…</option>
                      {allFeatures.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.title} ({f.roadmapTitle})</option>
                      ))}
                    </select>
                    {preselectedFeatureId && <p className="text-xs text-violet-500 mt-1">Locked to selected feature.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assignee</label>
                    {!featureId ? (
                      <p className="text-xs text-gray-400 italic p-3 border border-dashed border-gray-200 rounded-xl">Select a feature first.</p>
                    ) : (
                    <CustomDropdown
                      value={assignedUserId}
                      onChange={setAssignedUserId}
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...getMembersForFeature(featureId).map((u: any) => ({
                          value: String(u.id),
                          label: String(u.id) == String(user?.id) ? formatUserName(u, user?.id) : `${u.name} (${u.role})`
                        }))
                      ]}
                      placeholder="Select an assignee..."
                      className="w-full"
                    />
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModal}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 shadow-sm transition-all focus:ring-4 focus:ring-gray-200">
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)}
        entityType="Task" entityId={historyTaskId} entityTitle={historyTaskTitle} />

      {pendingStatusChange && (
        <StatusChangeModal
          isOpen={!!pendingStatusChange}
          onClose={() => setPendingStatusChange(null)}
          onConfirm={(description) => {
            updateTaskStatus(pendingStatusChange.id, pendingStatusChange.newStatus, description);
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
        entityType={notesEntityType}
        entityId={notesEntityId}
        entityTitle={notesEntityTitle}
      />
    </div>
  );
}
