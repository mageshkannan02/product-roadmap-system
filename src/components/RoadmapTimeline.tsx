import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag, 
  Loader2, 
  Target, 
  AlertCircle,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  UserPlus,
  ChevronDown,
  ChevronUp,
  X,
  ChevronRight
} from 'lucide-react';
import { EntityHoverCard } from './EntityHoverCard';
import { ItemNotes } from './ItemNotes';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

interface RoadmapTimelineProps {
  roadmapId: number;
  onClose?: () => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ roadmapId, onClose }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFeatureId, setExpandedFeatureId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/roadmaps/${roadmapId}`, token);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [roadmapId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading timeline...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-amber-600">
        <AlertCircle className="h-8 w-8 mb-4" />
        <p className="font-medium text-amber-800">{error || 'Roadmap not found.'}</p>
      </div>
    );
  }

  const { features = [], milestones = [] } = data;
  const completedCount = features.filter((f: any) => f.status === 'Completed').length;
  const totalCount = features.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const chartData = [
    { name: 'Completed', value: completedCount },
    { name: 'Pending', value: Math.max(0, totalCount - completedCount) }
  ];
  const COLORS = ['#10b981', '#f1f5f9']; // Emerald and light slate

  // No high-contrast headers, just clean info
  const hasContent = features.length > 0 || milestones.length > 0;

  return (
    <div className="space-y-8  sm:pl-2">
      
      {/* 📝 MINIMALIST HEADER WITH COMPLETION CHART */}
      <div className="w-full flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12">
        <div className="flex-1">
          <h2 className="text-4xl font-semibold text-slate-900 mb-4 tracking-tight">{data.title}</h2>
          <p className="text-slate-500 font-normal leading-relaxed text-lg max-w-2xl">{data.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span>{new Date(data.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(data.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="capitalize">{data.status.replace('_', ' ')}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.status === 'completed' ? 'bg-emerald-400' : 
                data.status === 'in_progress' ? 'bg-indigo-400' : 'bg-slate-300'
              }`}></div>
            </div>
          </div>
        </div>

        {/* 📊 LARGER COMPLETION PIE CHART */}
        <div className="flex flex-col items-center lg:items-end">
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-semibold text-slate-800 leading-none">{completionPercentage}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-2">Complete</span>
            </div>
          </div>
        </div>
      </div>

      {!hasContent ? (
        <div className="text-center p-16 bg-white border border-slate-100 rounded-2xl">
          <p className="text-slate-400 font-medium">Empty Strategical Path.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Distinct Vertical Track */}
          <div className="absolute left-6 top-1 bottom-8 w-0.5 bg-slate-200 rounded-full shadow-xs opacity-80"></div>
          
          <div className="space-y-12">
            
            {/* 🏁 MILESTONES (Integrated into timeline) */}
            {milestones.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6 relative">
                  <div className="absolute left-[21px] top-1.5 bg-white rounded-full p-0.5 z-10 shadow-xs border border-slate-100">
                    <Flag className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h3 className="ml-10 text-[10px] font-bold text-slate-300 uppercase tracking-[0.25em]">Checkpoints</h3>
                </div>
                <div className="space-y-4 ml-6 pl-4">
                  {milestones.map((m: any) => (
                    <div key={`m-${m.id}`} className="group relative bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-lg font-semibold text-slate-900 transition-colors">{m.title}</h4>
                          </div>
                          <p className="text-base text-slate-500 font-normal leading-relaxed">{m.description}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 tracking-tighter">
                          {m.target_date ? new Date(m.target_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📋 FEATURES (Main timeline track) */}
            {features.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6 relative">
                  <div className="absolute left-[23px] w-2 h-2 rounded-full border-2 border-white bg-slate-400 ring-4 ring-slate-50 z-10"></div>
                  <h3 className="ml-10 text-[10px] font-bold text-slate-300 uppercase tracking-[0.25em]">Deliverables</h3>
                </div>
                <div className="space-y-4 ml-6 pl-4">
                  {features.map((f: any) => (
                    <div key={`f-${f.id}`} className="relative mb-8 last:mb-0">
                      {/* Status Icon on Timeline Track */}
                      <div className="absolute -left-[38px] top-1.5 bg-white rounded-full p-0.5 z-10 shadow-xs border border-slate-100">
                        {f.status === 'Completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : f.status === 'Blocked' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>

                      <EntityHoverCard 
                        creator={f.creator} 
                        createdAt={f.createdAt} 
                        type="Feature"
                      >
                        <div 
                          onClick={() => setExpandedFeatureId(expandedFeatureId === f.id ? null : f.id)}
                          className="p-5 rounded-xl transition-all cursor-pointer bg-white group hover:shadow-xl hover:shadow-indigo-500/10 border border-transparent hover:border-indigo-100"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                  f.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                  f.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  f.priority === 'Medium' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                  'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                  {f.priority}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                                  {f.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{f.title}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className={`p-1.5 rounded-lg transition-transform duration-300 ${expandedFeatureId === f.id ? 'rotate-90 bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                               <div className="flex -space-x-2 relative group/assignees">
                                {(f.assignees || []).length > 0 ? (
                                  <>
                                    {(f.assignees || []).slice(0, 4).map((a: any) => (
                                      <div key={a.id} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm overflow-hidden transition-transform group-hover/assignees:scale-110" title={a.name}>
                                        {a.name.charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                    {f.assignees?.length > 4 && (
                                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                                        +{f.assignees.length - 4}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 group/unassigned cursor-help" title="No members assigned yet">
                                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center transition-colors group-hover/unassigned:border-indigo-300 group-hover/unassigned:bg-indigo-50">
                                      <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover/unassigned:text-indigo-500 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase group-hover/unassigned:text-indigo-600 transition-colors pl-1 whitespace-nowrap">Unassigned</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedFeatureId(expandedFeatureId === f.id ? null : f.id);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                  expandedFeatureId === f.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Notes</span>
                                {expandedFeatureId === f.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <div className="flex items-center gap-2 text-slate-300">
                                 <CheckSquare className="w-3.5 h-3.5" />
                                 <span className="text-xs font-bold text-slate-500">{f.tasks?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </EntityHoverCard>

                      {/* 📝 COLLAPSIBLE NOTES SECTION */}
                      {expandedFeatureId === f.id && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-6 -mx-5 -mb-5 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300 h-[450px] flex flex-col"
                        >
                          <ItemNotes featureId={f.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
