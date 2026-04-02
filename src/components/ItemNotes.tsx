import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: number;
  content: string;
  author: { id: number, name: string };
  createdAt: string;
}

interface ItemNotesProps {
  featureId?: number;
  taskId?: number;
  onClose?: () => void;
}

export const ItemNotes: React.FC<ItemNotesProps> = ({ featureId, taskId }) => {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [notes, loading]);

  const fetchNotes = async () => {
    try {
      const url = featureId 
        ? `/api/notes/feature/${featureId}`
        : `/api/notes/task/${taskId}`;
      const data = await api.get(url, token);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [featureId, taskId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newNote = await api.post('/api/notes', {
        content: content.trim(),
        feature_id: featureId,
        task_id: taskId
      }, token);
      
      // Since backend returns detailedNote with author
      setNotes([...notes, newNote]);
      setContent('');
    } catch (err) {
      console.error('Failed to post note', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center items-center h-[400px]"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 🏔 Header / Summary */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity & Notes</span>
        <span className="text-[10px] font-bold text-slate-400">{notes.length} thoughts</span>
      </div>

      {/* 💬 Notes List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 p-4 bg-white/50 backdrop-blur-sm scroll-smooth"
      >
        {notes.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
               <MessageSquare className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">No internal notes yet</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${note.author.id === user?.id ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-sm border-2 border-white ${
                note.author.id === user?.id ? 'bg-indigo-500' : 'bg-slate-400'
              }`}>
                {note.author.name.charAt(0).toUpperCase()}
              </div>
              <div className={`flex flex-col max-w-[85%] ${note.author.id === user?.id ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5 px-0.5">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{note.author.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(note.createdAt))} ago
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-xs border ${
                  note.author.id === user?.id 
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                }`}>
                  {note.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✍️ Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-50/80 border-t border-slate-100 backdrop-blur-md">
        <div className="relative group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add to the conversation..."
            className="w-full pl-4 pr-14 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none shadow-sm min-h-[50px] max-h-[150px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="absolute right-2.5 top-2.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-90"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest leading-none">Press Enter to post · Shift+Enter for new line</p>
      </form>
    </div>
  );
};
