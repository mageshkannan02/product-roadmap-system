import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  X,
  Loader2,
  MoreHorizontal,
  ArrowLeft,
  MessageSquare,
  Users
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { ChatDrawer } from '../components/ChatDrawer';
import { MemberManager } from '../components/MemberManager';
import { CustomDropdown } from '../components/CustomDropdown';
import toast from 'react-hot-toast';
import { formatUserName } from '../lib/utils';

// Types corresponding to the Sequelize model
interface Roadmap {
  id: number;
  title: string;
  description: string;
  start_date: string; // ISO string
  end_date: string;   // ISO string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  created_by: number;
}

type RoadmapFormData = Omit<Roadmap, 'id' | 'created_by'>;

const API_URL = '/api/roadmaps'; // Adjust based on actual API routing

const RoadmapManagement: React.FC = () => {
  const { token, user } = useAuth();
  
  // State
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingRoadmapId, setViewingRoadmapId] = useState<number | null>(null);
  const [chatRoadmapId, setChatRoadmapId] = useState<number | null>(null);
  const [chatRoadmapTitle, setChatRoadmapTitle] = useState('');
  const [managingMembersRoadmap, setManagingMembersRoadmap] = useState<any | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [formData, setFormData] = useState<RoadmapFormData>({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: 'planning'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'Admin' || user?.role === 'Product Manager';

  // Fetch Roadmaps
  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_URL, token);
      setRoadmaps(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch roadmaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
    // Fetch all users for member manager
    api.get('/api/users', token).then(setAllUsers).catch(() => {});
  }, []);

  // Handlers
  const handleOpenModal = (mode: 'create' | 'edit' | 'view', roadmap?: Roadmap) => {
    setModalMode(mode);
    if (roadmap) {
      setSelectedRoadmap(roadmap);
      setFormData({
        title: roadmap.title,
        description: roadmap.description,
        start_date: roadmap.start_date.split('T')[0],
        end_date: roadmap.end_date.split('T')[0],
        status: roadmap.status
      });
    } else {
      setSelectedRoadmap(null);
      setFormData({
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        status: 'planning'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoadmap(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = modalMode === 'edit' && selectedRoadmap ? `${API_URL}/${selectedRoadmap.id}` : API_URL;
      
      const payload = {
        ...formData
      };

      if (modalMode === 'edit') {
        await api.put(url, payload, token);
        toast.success('Roadmap updated successfully!');
      } else {
        await api.post(url, payload, token);
        toast.success('Roadmap created successfully!');
      }

      await fetchRoadmaps();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save roadmap.');
      setError('Failed to save roadmap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return;
    
    try {
      await api.delete(`${API_URL}/${id}`, token);
      setRoadmaps(prev => prev.filter(r => r.id !== id));
      toast.success('Roadmap deleted!');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete roadmap.');
      setError('Failed to delete roadmap.');
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const calculateProgress = (startDate: string, endDate: string, status: string) => {
    if (status === 'completed') return 100;
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / totalDuration) * 100);
  };

  const filteredRoadmaps = roadmaps.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (viewingRoadmapId) {
    return (
      <div className="min-h-screen bg-gray-50/50  font-sans text-slate-800">
        <div className="w-full">
          <button 
            onClick={() => setViewingRoadmapId(null)}
            className="mb-10 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all group bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Roadmaps
          </button>
          <RoadmapTimeline roadmapId={viewingRoadmapId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Roadmap Management</h1>
            <p className="text-slate-500 mt-1">Plan, track, and manage your product milestones and deliverables.</p>
          </div>
          {canManage && (
            <button 
              onClick={() => handleOpenModal('create')}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Roadmap
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search roadmaps by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 border bg-slate-50/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative inline-flex items-center w-full">
              <Filter className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'planning', label: 'Planning' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'completed', label: 'Completed' }
                ]}
                wrapperClassName="w-full"
                className="w-full pl-9 py-2 border-slate-300 shadow-sm font-medium text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 border-dashed">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-slate-500 font-medium">Loading roadmaps...</p>
          </div>
        ) : filteredRoadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 border-dashed">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No roadmaps found</h3>
            {canManage ? (
              <>
                <p className="mt-1 text-sm text-slate-500 text-center max-w-sm">
                  Get started by creating a new roadmap to track your product's journey and milestones.
                </p>
                <button 
                  onClick={() => handleOpenModal('create')}
                  className="mt-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Create Roadmap
                </button>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500 text-center max-w-sm">
                No roadmaps have been shared with you or assigned to you yet. Stay tuned!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRoadmaps.map((roadmap) => {
              const progress = calculateProgress(roadmap.start_date, roadmap.end_date, roadmap.status);
              
              return (
                <div key={roadmap.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      
                      {/* Info Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 truncate" title={roadmap.title}>
                            {roadmap.title}
                          </h3>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(roadmap.status)}`}>
                            {formatStatus(roadmap.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                          {roadmap.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                          <div className="flex items-center">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            From: {new Date(roadmap.start_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            To: {new Date(roadmap.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-2 sm:ml-4 sm:shrink-0">
                        {/* Chat — visible to all */}
                        <button 
                          onClick={() => { setChatRoadmapId(roadmap.id); setChatRoadmapTitle(roadmap.title); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Project Chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {/* Manage Members — managers only */}
                        {canManage && (
                          <button 
                            onClick={() => setManagingMembersRoadmap(roadmap)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Manage Members"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                        )}
                        {/* View Details — visible to all */}
                        <button 
                          onClick={() => setViewingRoadmapId(roadmap.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Edit & Delete — managers only */}
                        {canManage && (
                          <>
                            <button 
                              onClick={() => handleOpenModal('edit', roadmap)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(roadmap.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Members preview */}
                    {(roadmap as any).members && (roadmap as any).members.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Team:</span>
                        <div className="flex -space-x-1.5">
                          {(roadmap as any).members.slice(0, 5).map((m: any) => (
                            <div key={m.id} title={formatUserName(m, user?.id)} className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {(roadmap as any).members.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold border-2 border-white">+{(roadmap as any).members.length - 5}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeline / Progress View */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700">Timeline Progress</span>
                        <span className="font-medium text-slate-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ease-out ${
                            roadmap.status === 'completed' ? 'bg-emerald-500' : 
                            roadmap.status === 'on_hold' ? 'bg-amber-400' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit/View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCloseModal} style={{ zIndex: 0 }}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-bold text-slate-900" id="modal-title">
                    {modalMode === 'create' ? 'Create New Roadmap' : 
                     modalMode === 'edit' ? 'Edit Roadmap' : 'Roadmap Details'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500 rounded-lg p-1 hover:bg-slate-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      readOnly={modalMode === 'view'}
                      value={formData.title}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="e.g., Q3 Platform Upgrades"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      readOnly={modalMode === 'view'}
                      value={formData.description}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="High-level goals and objectives..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        id="start_date"
                        required
                        readOnly={modalMode === 'view'}
                        value={formData.start_date}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        id="end_date"
                        required
                        readOnly={modalMode === 'view'}
                        value={formData.end_date}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <CustomDropdown
                      value={formData.status}
                      onChange={(val) => setFormData(prev => ({ ...prev, status: val as any }))}
                      disabled={modalMode === 'view'}
                      options={[
                        { value: 'planning', label: 'Planning', colorClass: 'font-semibold text-purple-600' },
                        { value: 'in_progress', label: 'In Progress', colorClass: 'font-semibold text-blue-600' },
                        { value: 'on_hold', label: 'On Hold', colorClass: 'font-semibold text-orange-600' },
                        { value: 'completed', label: 'Completed', colorClass: 'font-semibold text-emerald-600' }
                      ]}
                      className="w-full"
                    />
                  </div>

                  {modalMode !== 'view' && (
                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 transition-colors"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          modalMode === 'create' ? 'Create Roadmap' : 'Save Changes'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {modalMode === 'view' && (
                     <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex justify-end">
                       <button
                        type="button"
                        onClick={handleCloseModal}
                        className="inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:text-sm transition-colors"
                      >
                        Close
                      </button>
                     </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatDrawer 
        roadmapId={chatRoadmapId} 
        roadmapTitle={chatRoadmapTitle} 
        onClose={() => setChatRoadmapId(null)} 
      />

      {managingMembersRoadmap && (
        <MemberManager
          roadmapId={managingMembersRoadmap.id}
          roadmapTitle={managingMembersRoadmap.title}
          members={(managingMembersRoadmap as any).members || []}
          allUsers={allUsers}
          onClose={() => setManagingMembersRoadmap(null)}
          onMembersChanged={(updatedMembers) => {
            setRoadmaps(prev => prev.map(r =>
              r.id === managingMembersRoadmap.id ? { ...r, members: updatedMembers } : r
            ));
            setManagingMembersRoadmap((prev: any) => prev ? { ...prev, members: updatedMembers } : null);
          }}
        />
      )}

    </div>
  );
};

export  {RoadmapManagement};
