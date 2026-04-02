import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PieChart as PieChartIcon, FolderGit2, AlertCircle, Users, CheckCircle2, Clock, CalendarX, BarChart3, X, ArrowRight, Loader2, Flag, CalendarDays, MessageSquare } from 'lucide-react';
import { EntityHoverCard } from '../components/EntityHoverCard';
import { NotesModal } from '../components/NotesModal';
import { format, isPast, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChatDrawer } from '../components/ChatDrawer';
import { formatUserName } from '../lib/utils';

export function ProjectOverview() {
  const { user, token } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);
  const [detailedRoadmap, setDetailedRoadmap] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [chatRoadmapId, setChatRoadmapId] = useState<number | null>(null);
  const [chatRoadmapTitle, setChatRoadmapTitle] = useState('');

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesEntityId, setNotesEntityId] = useState<number>(0);
  const [notesEntityType, setNotesEntityType] = useState<'Feature' | 'Task'>('Feature');
  const [notesEntityTitle, setNotesEntityTitle] = useState('');

  useEffect(() => {
    if (token) {
      fetchRoadmaps();
    }
  }, [token, user]);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/roadmaps?view=overview', token);
      
      // The backend already filters based on role:
      // Admin sees all. PM sees their own. Team Member sees projects they are in.
      setRoadmaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmapDetails = async (id: number) => {
    setSelectedRoadmapId(id);
    setLoadingDetails(true);
    setDetailedRoadmap(null);
    try {
      const data = await api.get(`/api/roadmaps/${id}?view=overview`, token);
      setDetailedRoadmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Allow all authenticated users to see their eligible projects
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Calculate deep metrics for the detailed roadmap
  const getMetrics = () => {
    if (!detailedRoadmap) return null;

    const features = detailedRoadmap.features || [];
    const tasks = features.flatMap((f: any) => f.tasks || []);

    const totalFeatures = features.length;
    const completedFeatures = features.filter((f: any) => f.status === 'Completed').length;
    const featureProgress = totalFeatures === 0 ? 0 : Math.round((completedFeatures / totalFeatures) * 100);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'Done').length;
    const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Chart Data
    const featureData = [
      { name: 'Planned', value: features.filter((f: any) => f.status === 'Planned').length, color: '#94a3b8' },
      { name: 'In Progress', value: features.filter((f: any) => f.status === 'In Progress').length, color: '#6366f1' },
      { name: 'Completed', value: features.filter((f: any) => f.status === 'Completed').length, color: '#10b981' },
      { name: 'Blocked', value: features.filter((f: any) => f.status === 'Blocked').length, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const taskData = [
      { name: 'To Do', value: tasks.filter((t: any) => t.status === 'To Do').length, color: '#94a3b8' },
      { name: 'In Progress', value: tasks.filter((t: any) => t.status === 'In Progress').length, color: '#3b82f6' },
      { name: 'Review', value: tasks.filter((t: any) => t.status === 'Review').length, color: '#f59e0b' },
      { name: 'Done', value: tasks.filter((t: any) => t.status === 'Done').length, color: '#10b981' }
    ].filter(d => d.value > 0);

    // Extract unique assignees
    const assigneesMap = new Map<number, any>();
    features.forEach((f: any) => {
      (f.assignees || []).forEach((a: any) => assigneesMap.set(a.id, a));
    });
    tasks.forEach((t: any) => {
      if (t.assignee) assigneesMap.set(t.assignee.id, t.assignee);
    });
    const uniqueAssignees = Array.from(assigneesMap.values());

    // Milestones
    const milestones = detailedRoadmap.milestones || [];
    const sortedMilestones = [...milestones].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    // Overdue items
    const overdueFeatures = features.filter((f: any) => f.deadline && isPast(new Date(f.deadline)) && f.status !== 'Completed');
    const overdueTasks = tasks.filter((t: any) => t.deadline && isPast(new Date(t.deadline)) && t.status !== 'Done');

    return {
      features: { total: totalFeatures, completed: completedFeatures, progress: featureProgress, chartData: featureData },
      tasks: { total: totalTasks, completed: completedTasks, progress: taskProgress, chartData: taskData },
      team: uniqueAssignees,
      milestones: sortedMilestones,
      overdue: { features: overdueFeatures, tasks: overdueTasks }
    };
  };

  const metrics = getMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'in_progress': return 'bg-indigo-100 text-indigo-800';
      case 'on_hold': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChartIcon className="w-6 h-6 text-slate-500" />
            Project Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.role === 'Admin' ? 'A high-level view of all projects across the organization.' : 'A high-level view of the projects you own.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <FolderGit2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900">No Projects Found</h3>
          <p className="text-slate-500 mt-2">You don't have any projects to oversee currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map(roadmap => (
            <EntityHoverCard 
              key={roadmap.id} 
              creator={roadmap.creator} 
              createdAt={roadmap.createdAt} 
              type="Roadmap"
            >
              <div 
                onClick={() => fetchRoadmapDetails(roadmap.id)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <FolderGit2 className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(roadmap.status)}`}>
                    {roadmap.status?.replace('_', ' ') || 'Active'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 leading-tight group-hover:text-slate-700 transition-colors">
                  {roadmap.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                  {roadmap.description || 'No description provided for this project.'}
                </p>
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {roadmap.end_date ? format(new Date(roadmap.end_date), 'MMM d, yyyy') : 'No deadline'}
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600" />
                </div>
              </div>
            </EntityHoverCard>
          ))}
        </div>
      )}

      {/* Deep Metrics Modal/Drawer */}
      <AnimatePresence>
        {selectedRoadmapId && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoadmapId(null)}
              className="absolute inset-0 bg-slate-200/60 backdrop-blur-sm transition-opacity"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] bg-gray-50 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-gray-200"
            >
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white h-full">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-500 font-medium">Crunching project metrics...</p>
                </div>
              ) : detailedRoadmap && metrics ? (
                <>
                  {/* Header */}
                  <div className="bg-white px-6 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shrink-0">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900 leading-none">{detailedRoadmap.title}</h2>
                          <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase">Project Analytics View</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setChatRoadmapId(detailedRoadmap.id); setChatRoadmapTitle(detailedRoadmap.title); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Project Chat
                      </button>
                      <button 
                        onClick={() => setSelectedRoadmapId(null)}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="p-6 overflow-y-auto w-full max-h-full scrollbar-hide">
                    
                    {/* Executive Summary */}
                    <div className="mb-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Project Vision</h3>
                        <p className="text-gray-700 leading-relaxed font-medium text-sm">
                          {detailedRoadmap.description || 'No description provided for this project.'}
                        </p>
                      </div>
                      <div className="md:border-l border-slate-100 md:pl-6 min-w-[200px]">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Timeline</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-gray-600 font-medium">Started:</span>
                            <span className="text-gray-900 font-semibold">{detailedRoadmap.start_date ? format(new Date(detailedRoadmap.start_date), 'MMM d, yy') : 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Flag className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-gray-600 font-medium">Deadline:</span>
                            <span className="text-gray-900 font-semibold">{detailedRoadmap.end_date ? format(new Date(detailedRoadmap.end_date), 'MMM d, yy') : 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-gray-600 font-medium">Days Left:</span>
                            <span className="text-gray-900 font-semibold">
                              {detailedRoadmap.end_date 
                                ? Math.max(0, differenceInDays(new Date(detailedRoadmap.end_date), new Date()))
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Features Progress */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Features Breakdown</p>
                            <p className="text-2xl font-bold text-slate-900">{metrics.features.progress}%</p>
                          </div>
                          <p className="text-sm font-medium text-gray-400">
                            <span className="text-emerald-600 font-bold">{metrics.features.completed}</span> / {metrics.features.total}
                          </p>
                        </div>
                        {metrics.features.chartData.length > 0 ? (
                          <div className="h-48 w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={metrics.features.chartData} 
                                  cx="50%" cy="50%" 
                                  innerRadius={50} outerRadius={70} 
                                  paddingAngle={3} dataKey="value"
                                >
                                  {metrics.features.chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip wrapperClassName="rounded-xl shadow-lg border-gray-100" />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-48 w-full flex items-center justify-center bg-gray-50/50 rounded-xl mt-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase">No Features</p>
                          </div>
                        )}
                      </div>

                      {/* Tasks Progress */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tasks Breakdown</p>
                            <p className="text-2xl font-bold text-slate-900">{metrics.tasks.progress}%</p>
                          </div>
                          <p className="text-sm font-medium text-gray-400">
                            <span className="text-emerald-600 font-bold">{metrics.tasks.completed}</span> / {metrics.tasks.total}
                          </p>
                        </div>
                        {metrics.tasks.chartData.length > 0 ? (
                          <div className="h-48 w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={metrics.tasks.chartData} 
                                  cx="50%" cy="50%" 
                                  innerRadius={50} outerRadius={70} 
                                  paddingAngle={3} dataKey="value"
                                >
                                  {metrics.tasks.chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip wrapperClassName="rounded-xl shadow-lg border-gray-100" />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-48 w-full flex items-center justify-center bg-gray-50/50 rounded-xl mt-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase">No Tasks</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Project Team Section */}
                      <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-bold text-gray-900 text-sm leading-none">Project Team ({detailedRoadmap.members?.length || 0})</h3>
                          </div>
                          <div className="p-4 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
                            {(!detailedRoadmap.members || detailedRoadmap.members.length === 0) ? (
                              <p className="text-sm text-gray-500 text-center py-8">No team members assigned.</p>
                            ) : (
                              <div className="space-y-2">
                                {detailedRoadmap.members.map((member: any) => (
                                  <div key={`tm-${member.id}`} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm hover:border-indigo-200 transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black shrink-0">
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">
                                        {formatUserName(member, user.id)}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate">{member.role}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Items (Overdue) */}
                      <div className="lg:col-span-2 bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <h3 className="font-bold text-gray-900 text-sm leading-none">Attention Required (Overdue Items)</h3>
                          <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {metrics.overdue.features.length + metrics.overdue.tasks.length} Issues
                          </span>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
                          {metrics.overdue.features.length === 0 && metrics.overdue.tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-emerald-600">
                              <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                              <h4 className="text-lg font-bold">All caught up!</h4>
                              <p className="text-sm font-medium opacity-80 mt-1 uppercase tracking-tight">No overdue deliverables for this project.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-red-50">
                              {metrics.overdue.features.map((f: any) => (
                                <EntityHoverCard 
                                  key={`f-${f.id}`} 
                                  creator={f.creator} 
                                  createdAt={f.createdAt} 
                                  type="Feature"
                                >
                                  <div className="px-6 py-4 hover:bg-red-50/30 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-red-400 rounded-full shrink-0" />
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-black tracking-widest rounded bg-red-100/50 text-red-700 border border-red-200 shrink-0">Feature</span>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{f.title}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <CalendarX className="w-3 h-3 text-red-400" />
                                            Missed deadline: {format(new Date(f.deadline), 'MMM d, yyyy')}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-white px-2.5 py-1.5 rounded-lg border border-red-100 shadow-sm shrink-0 uppercase tracking-tighter">
                                        {Math.abs(differenceInDays(new Date(f.deadline), new Date()))}D Overdue
                                      </div>
                                      <button 
                                        onClick={() => { setNotesEntityType('Feature'); setNotesEntityId(f.id); setNotesEntityTitle(f.title); setNotesModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                                        title="Discussion"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </EntityHoverCard>
                              ))}
                              {metrics.overdue.tasks.map((t: any) => (
                                <EntityHoverCard 
                                  key={`t-${t.id}`} 
                                  creator={t.creator} 
                                  createdAt={t.createdAt} 
                                  type="Task"
                                >
                                  <div className="px-6 py-4 hover:bg-red-50/30 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-orange-400 rounded-full shrink-0" />
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-black tracking-widest rounded bg-orange-100/50 text-orange-700 border border-orange-200 shrink-0">Task</span>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{t.title}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <CalendarX className="w-3 h-3 text-red-400" />
                                            Missed deadline: {format(new Date(t.deadline), 'MMM d, yyyy')}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-white px-2.5 py-1.5 rounded-lg border border-red-100 shadow-sm shrink-0 uppercase tracking-tighter">
                                        {Math.abs(differenceInDays(new Date(t.deadline), new Date()))}D Overdue
                                      </div>
                                      <button 
                                        onClick={() => { setNotesEntityType('Task'); setNotesEntityId(t.id); setNotesEntityTitle(t.title); setNotesModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                                        title="Discussion"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </EntityHoverCard>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChatDrawer 
        roadmapId={chatRoadmapId} 
        roadmapTitle={chatRoadmapTitle} 
        onClose={() => setChatRoadmapId(null)} 
      />

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
