import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { formatUserName } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatDrawerProps {
  roadmapId: number | null;
  roadmapTitle?: string;
  onClose: () => void;
}

export function ChatDrawer({ roadmapId, roadmapTitle, onClose }: ChatDrawerProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Polling ref to clear interval
  const pollInterval = useRef<any>(null);

  const fetchMessages = async (showLoader = false) => {
    if (!roadmapId) return;
    if (showLoader) setLoading(true);
    try {
      const data = await api.get(`/api/roadmaps/${roadmapId}/messages`, token);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (roadmapId) {
      fetchMessages(true);
      // Poll every 3 seconds
      pollInterval.current = setInterval(() => fetchMessages(false), 3000);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [roadmapId, token]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roadmapId || sending) return;

    setSending(true);
    try {
      const msg = await api.post(`/api/roadmaps/${roadmapId}/messages`, { content: newMessage }, token);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {roadmapId && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="bg-white px-6 py-5 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Project Chat</h2>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{roadmapTitle || 'General Discussion'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  const showHeader = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id || new Date(msg.createdAt).getTime() - new Date(messages[idx - 1].createdAt).getTime() > 300000; // Show header if different sender or 5+ mins apart
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <span className="text-xs font-bold text-gray-700">{formatUserName(msg.sender, user?.id)}</span>
                          <span className="text-[10px] font-medium text-gray-400">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                        </div>
                      )}
                      <div 
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                        }`}
                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent block px-4 py-3 resize-none outline-none"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <p className="absolute -bottom-5 left-1 text-[10px] text-gray-400 font-medium">Press Enter to send, Shift+Enter for new line</p>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
