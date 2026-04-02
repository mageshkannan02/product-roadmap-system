import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

interface EntityHoverCardProps {
  children: React.ReactNode;
  creator?: { name: string };
  createdAt?: string;
  type: 'Roadmap' | 'Feature' | 'Task';
}

export const EntityHoverCard: React.FC<EntityHoverCardProps> = ({ children, creator, createdAt, type }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 240, height: 200 }); // Reasonable defaults

  useLayoutEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Calculate adjusted position
  let left = mousePos.x + 15;
  let top = mousePos.y + 15;

  // Flip if would go off right
  if (left + dimensions.width > window.innerWidth - 20) {
    left = mousePos.x - dimensions.width - 15;
  }
  // Flip if would go off bottom
  if (top + dimensions.height > window.innerHeight - 20) {
    top = mousePos.y - dimensions.height - 15;
  }

  // Final safety checks for top/left edges
  left = Math.max(20, left);
  top = Math.max(20, top);

  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      
      <AnimatePresence>
        {isHovered && (creator || createdAt) && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            style={{
              position: 'fixed',
              left,
              top,
              zIndex: 9999,
              pointerEvents: 'none'
            }}
            className="bg-white text-slate-900 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-indigo-50 backdrop-blur-xl min-w-[240px]"
          >
            <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-slate-50">
               <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Provenance Metadata</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-indigo-200">
                  {creator?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Created By</p>
                  <p className="text-sm font-bold text-slate-800 tracking-tight">{creator?.name || 'System Admin'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3.5 pl-0.5">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                  <p className="text-[11px] font-bold text-slate-600">
                    {createdAt ? format(new Date(createdAt), 'MMM d, yyyy · p') : 'No date recorded'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Subtle Pointer Decor */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
