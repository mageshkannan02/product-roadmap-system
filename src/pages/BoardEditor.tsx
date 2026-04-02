import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export function BoardEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [boardData, setBoardData] = useState<any>(null);
  const [title, setTitle] = useState('Loading...');
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const data = await api.get(`/api/boards/${id}`, token);
        setTitle(data.title);
        setBoardData(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token && id) fetchBoard();
  }, [id, token]);

  const handleMount = (editorInstance: any) => {
    setEditor(editorInstance);
    if (boardData && boardData.created_by !== user?.id && user?.role !== 'Admin') {
      try { editorInstance.updateInstanceState({ isReadonly: true }); } catch (e) {}
      try { editorInstance.isReadonly = true; } catch (e) {}
    }
    
    if (boardData && boardData.nodes && boardData.nodes !== '[]') {
      try {
        const snapshot = JSON.parse(boardData.nodes);
        loadSnapshot(editorInstance.store, snapshot);
      } catch (e) {
        console.error("Failed to load snapshot", e);
      }
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const snapshot = getSnapshot(editor.store);
      await api.put(`/api/boards/${id}`, {
        title,
        nodes: JSON.stringify(snapshot),
        edges: '[]'
      }, token);
      
      toast.success('Sketch saved successfully!');
      setTimeout(() => {
        navigate('/boards');
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save sketch');
      setIsSaving(false);
    }
  };

  const isOwner = boardData?.created_by === user?.id || user?.role === 'Admin';

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 z-50">
      {/* Header toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/boards')} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isOwner}
            className={`text-lg font-bold text-gray-900 border-none outline-none focus:ring-0 bg-transparent min-w-[300px] ${!isOwner ? 'opacity-100' : ''}`}
          />
        </div>
        <div className="flex items-center space-x-3">
          {boardData?.roadmap && (
            <span className="text-gray-500 hidden sm:inline-block mr-4 font-medium px-3 py-1 bg-gray-100 rounded text-sm border border-gray-200 shadow-sm">
              Project: {boardData.roadmap.title}
            </span>
          )}
          {isOwner ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-4 py-2 text-sm text-white rounded shadow-sm transition-colors font-medium ${
                isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Sketch'}
            </button>
          ) : (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-md border border-amber-200">
              Read-Only View
            </span>
          )}
        </div>
      </div>

      {/* Tldraw Canvas */}
      <div className="relative grow">
        {boardData !== null ? (
          <Tldraw onMount={handleMount} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 font-medium">
            Loading Canvas...
          </div>
        )}
      </div>
    </div>
  );
}
