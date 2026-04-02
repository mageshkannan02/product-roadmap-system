import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Layout, Pencil, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { formatUserName } from '../lib/utils';

export function Boards() {
  const { token, user } = useAuth();
  const [boards, setBoards] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [editBoardId, setEditBoardId] = useState<number | null>(null);
  const [shareBoardId, setShareBoardId] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  
  const [title, setTitle] = useState('');
  const [roadmapId, setRoadmapId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const [filter, setFilter] = useState<'all' | 'my' | 'shared'>('all');
  
  const navigate = useNavigate();
  const canManage = user?.role === 'Admin' || user?.role === 'Product Manager';

  const fetchData = async () => {
    try {
      const [boardsData, roadmapsData, usersData] = await Promise.all([
        api.get('/api/boards', token),
        api.get('/api/roadmaps', token),
        api.get('/api/users', token)
      ]);
      setBoards(boardsData);
      setRoadmaps(roadmapsData);
      setAllUsers(usersData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const payload = { 
        title: title || 'New Sketch', 
        roadmap_id: roadmapId ? parseInt(roadmapId) : null,
        nodes: '[]', 
        edges: '[]' 
      };
      const newBoard = await api.post('/api/boards', payload, token);
      toast.success('Sketch created successfully!');
      navigate(`/boards/${newBoard.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create sketch');
      setIsCreating(false);
    }
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBoardId) return;
    setIsCreating(true);
    try {
      await api.put(`/api/boards/${editBoardId}`, { 
        title: title || 'Untitled Sketch',
        roadmap_id: roadmapId ? parseInt(roadmapId) : null
      }, token);
      setShowEditModal(false);
      setIsCreating(false);
      toast.success('Sketch details updated!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update details');
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this sketch perfectly forever?')) {
      try {
        await api.delete(`/api/boards/${id}`, token);
        toast.success('Sketch permanently deleted');
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete sketch');
      }
    }
  };

  const openEditModal = (e: React.MouseEvent, b: any) => {
    e.stopPropagation();
    setTitle(b.title);
    setRoadmapId(b.roadmap_id ? b.roadmap_id.toString() : '');
    setEditBoardId(b.id);
    setShowEditModal(true);
  };

  const openShareModal = (e: React.MouseEvent, b: any) => {
    e.stopPropagation();
    setShareBoardId(b.id);
    setSelectedUserIds(b.shared_with ? b.shared_with.map((u: any) => u.id) : []);
    setShowShareModal(true);
  };

  const handleSaveShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareBoardId) return;
    setIsSharing(true);
    try {
      await api.put(`/api/boards/${shareBoardId}/share`, { userIds: selectedUserIds }, token);
      toast.success('Sharing permissions updated!');
      setShowShareModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update permissions');
    } finally {
      setIsSharing(false);
    }
  };

  const openCreateModal = () => {
    setTitle('');
    setRoadmapId('');
    setShowModal(true);
  };

  const filteredBoards = boards.filter(b => {
    if (filter === 'my') return b.created_by === user?.id;
    if (filter === 'shared') return b.created_by !== user?.id;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Whiteboards & Sketches</h1>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              My Sketches
            </button>
            <button
              onClick={() => setFilter('shared')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'shared' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Shared with Me
            </button>
          </div>
          {canManage && (
            <button
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Sketch
            </button>
          )}
        </div>
      </div>

      {filteredBoards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>
            {filter === 'shared' 
              ? "No sketches have been shared with you yet." 
              : filter === 'my'
              ? (canManage ? "You haven't created any sketches yet. Create one to get started!" : "You haven't created any sketches yet.")
              : (canManage ? "No sketches found. Create a whiteboard to start visualizing your plans!" : "No sketches found here.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map(b => (
            <div 
              key={b.id} 
              onClick={() => navigate(`/boards/${b.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow relative group hover:border-indigo-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Layout className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{b.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {b.roadmap && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Project: {b.roadmap.title}
                        </span>
                      )}
                      {b.shared_with && b.shared_with.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border-blue-200 border">
                          <Share2 className="w-3 h-3 mr-1" />
                          Shared ({b.shared_with.length})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(user?.id === b.created_by || user?.role === 'Admin') && (
                    <button onClick={(e) => openShareModal(e, b)} title="Share Settings" className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-50">
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  {(user?.id === b.created_by || user?.role === 'Admin') && (
                    <button onClick={(e) => openEditModal(e, b)} title="Edit Properties" className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {(user?.id === b.created_by || user?.role === 'Admin') && (
                    <button onClick={(e) => handleDelete(e, b.id)} title="Delete Sketch" className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                <span>Created: {new Date(b.createdAt).toLocaleDateString()}</span>
                {user?.id !== b.created_by && user?.role !== 'Admin' && (
                   <span className="italic text-gray-400 text-xs">(Read Only)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sharing Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowShareModal(false)}></div>
            <div className="relative z-10 bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Share Sketch (Read-Only)</h2>
              <form onSubmit={handleSaveShare} className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Select members to grant read-only view access to this sketch.</p>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                  {allUsers.filter(u => u.id !== user?.id).map(u => (
                    <label key={u.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                          else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatUserName(u, user?.id)}</p>
                        <p className="text-xs text-gray-500">{u.role}</p>
                      </div>
                    </label>
                  ))}
                  {allUsers.filter(u => u.id !== user?.id).length === 0 && (
                    <p className="text-sm text-gray-500 p-2">No other users found in the system.</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3 text-sm">
                  <button type="button" onClick={() => setShowShareModal(false)} className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSharing} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50">{isSharing ? 'Saving...' : 'Save Permissions'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="relative z-10 bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Create New Sketch</h2>
              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sketch Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architecture Diagram"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Link to Project (Optional)</label>
                  <select
                    value={roadmapId}
                    onChange={e => setRoadmapId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white"
                  >
                    <option value="">-- No Project --</option>
                    {roadmaps.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isCreating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">{isCreating ? 'Creating...' : 'Create Sketch'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>
            <div className="relative z-10 bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Edit Sketch Properties</h2>
              <form onSubmit={handleUpdateBoard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sketch Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Link to Project (Optional)</label>
                  <select
                    value={roadmapId}
                    onChange={e => setRoadmapId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white"
                  >
                    <option value="">-- No Project --</option>
                    {roadmaps.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isCreating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">{isCreating ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
