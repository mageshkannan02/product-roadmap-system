import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Send, Bot, X, MessageSquare, Sparkles, Loader2, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function LuminaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am Lumina, your personal AI assistant. How can I help you manage your tasks today?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const [placement, setPlacement] = useState<{
    vertical: 'above' | 'below';
    horizontal: 'start' | 'center' | 'end';
  }>({ vertical: 'above', horizontal: 'center' });

  const onDragEnd = (_: any, info: any) => {
    const { x, y } = info.point;
    const { innerWidth: width, innerHeight: height } = window;

    // Detect if we're in the top half (open below) or bottom half (open above)
    const vertical = y < height / 2 ? 'below' : 'above';
    
    // Detect horizontal placement for popup alignment
    const horizontal = x < width / 3 ? 'start' : x > (width * 2) / 3 ? 'end' : 'center';

    setPlacement({ vertical, horizontal });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) {
        throw new Error('Failed to reach Lumina');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.actionTaken) {
        toast.success("Action performed by Lumina!");
        // Refresh page data if needed, or just let the user know
        // window.location.reload(); 
      }
    } catch (error) {
      toast.error("Lumina is currently unavailable.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "What are my tasks today?",
    "Show my overdue tasks",
    "How is the project status?",
    "Set my latest task to Done"
  ];

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
      <motion.div 
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={constraintsRef}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex",
          placement.vertical === 'above' ? "flex-col" : "flex-col-reverse",
          placement.horizontal === 'start' ? "items-start" : 
          placement.horizontal === 'end' ? "items-end" : "items-center"
        )}
      >
      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "w-[400px] h-[600px] bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in duration-300",
          placement.vertical === 'above' ? "mb-4 slide-in-from-bottom-5" : "mt-4 slide-in-from-top-5"
        )}>
          {/* Header (Drag Handle) */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="p-4 bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-between cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Lumina AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest">Active Assistant</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
                  msg.role === 'assistant' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-sm max-w-none",
                  msg.role === 'assistant' 
                    ? "bg-white border border-indigo-50 text-slate-800 rounded-tl-none" 
                    : "bg-indigo-600 text-white rounded-tr-none"
                )}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                        code: ({node, ...props}) => <code className="bg-indigo-50 px-1 rounded text-indigo-600 font-mono text-xs" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 bg-white border border-indigo-50 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Lumina is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 py-2 flex flex-wrap gap-2 bg-slate-50/50">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    // Trigger send manually if needed, or just let them click send
                  }}
                  className="px-3 py-1.5 bg-white border border-indigo-100 rounded-full text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form 
            onSubmit={handleSend}
            className="p-4 bg-white border-t border-slate-100 flex gap-2"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lumina anything..."
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button (Drag Handle) */}
      <motion.button 
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group relative overflow-hidden",
          isOpen 
            ? "bg-slate-800 text-white rotate-90" 
            : "bg-linear-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white hover:scale-110 hover:-translate-y-1"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <div className="relative">
            <Sparkles className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600" />
          </div>
        )}
      </motion.button>
    </motion.div>
    </>
  );
}
