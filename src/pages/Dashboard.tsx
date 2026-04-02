import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { format, isPast, startOfDay } from 'date-fns';
import { AlertCircle, Clock, CheckCircle2, ListTodo, Briefcase, CalendarX, Layout, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { EntityHoverCard } from '../components/EntityHoverCard';
import { NotesModal } from '../components/NotesModal';

export function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roadmapsData, tasksData, boardsData] = await Promise.all([
          api.get('/api/roadmaps', token),
          api.get('/api/tasks', token),
          api.get('/api/boards', token)
        ]);
        setRoadmaps(roadmapsData);
        setTasks(tasksData);
        setBoards(boardsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesEntityId, setNotesEntityId] = useState<number>(0);
  const [notesEntityType, setNotesEntityType] = useState<'Feature' | 'Task'>('Feature');
  const [notesEntityTitle, setNotesEntityTitle] = useState('');



  // Derived Data
  const myTasks = tasks.filter(t => t.assigned_user_id === user?.id);
  const currentTasks = myTasks.filter(t => t.status !== 'Done');
  const completedTasksCount = tasks.filter(t => t.status === 'Done').length;

  const allFeatures = roadmaps.flatMap(r => r.features || []);
  // Team Members only see features they are explicitly assigned to
  const myFeatures = user?.role === 'Team Member'
    ? allFeatures.filter((f: any) => f.assignees?.some((a: any) => a.id === user?.id))
    : allFeatures;
  const today = startOfDay(new Date());
  
  const overdueFeatures = myFeatures.filter(f => 
    f.deadline && isPast(new Date(f.deadline)) && f.status !== 'Completed'
  ).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-2 text-lg">Here's what's happening on your plate today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>{format(new Date(), 'EEEE, MMMM do')}</span>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{roadmaps.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">My Active Tasks</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{currentTasks.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <CalendarX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Overdue Features</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{overdueFeatures.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Sketches & Boards</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{boards.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plate: Assigned Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListTodo className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">Current Plate</h3>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">{currentTasks.length} Pending</span>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-hide">
            {currentTasks.length > 0 ? currentTasks.map(task => (
              <EntityHoverCard 
                key={task.id} 
                creator={task.creator} 
                createdAt={task.createdAt} 
                type="Task"
              >
                <div 
                  onClick={() => navigate('/tasks')}
                  className="group p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white relative cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base leading-tight">{task.title}</h4>
                      <p className="text-sm font-medium text-gray-500 mt-1">{task.Feature?.title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                      task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      task.status === 'Review' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setNotesEntityType('Task'); 
                        setNotesEntityId(task.id); 
                        setNotesEntityTitle(task.title); 
                        setNotesModalOpen(true); 
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Notes</span>
                    </button>
                  </div>
                </div>
              </EntityHoverCard>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">You're all caught up!</p>
                  <p className="text-sm mt-1">No active tasks assigned to you right now.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Items (Features) */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-red-100 bg-red-50/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Overdue Deliverables</h3>
            </div>
            {overdueFeatures.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center animate-pulse">
                {overdueFeatures.length} Overdue
              </span>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-hide">
            {overdueFeatures.length > 0 ? overdueFeatures.map(feature => (
              <EntityHoverCard 
                key={feature.id} 
                creator={feature.creator} 
                createdAt={feature.createdAt} 
                type="Feature"
              >
                <div 
                  onClick={() => navigate(user?.role === 'Team Member' ? '/roadmaps' : '/features')}
                  className="group p-5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors relative cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base leading-tight">{feature.title}</h4>
                      <p className="text-sm font-medium text-gray-600 mt-1 line-clamp-2">{feature.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                      <CalendarX className="w-3.5 h-3.5 mr-1" />
                      Due: {format(new Date(feature.deadline), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 bg-white rounded border border-gray-200">
                      {feature.status}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setNotesEntityType('Feature'); 
                        setNotesEntityId(feature.id); 
                        setNotesEntityTitle(feature.title); 
                        setNotesModalOpen(true); 
                      }}
                      className="ml-auto p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 flex items-center gap-1"
                      title="Feature Notes"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Notes</span>
                    </button>
                  </div>
                </div>
              </EntityHoverCard>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Perfect track record!</p>
                  <p className="text-sm mt-1">There are no overdue features across your projects.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Sketches Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Whiteboards & Shared Sketches</h3>
          </div>
          <button 
            onClick={() => navigate('/boards')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1"
          >
            Go to Whiteboards
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-6">
          {boards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {boards.slice(0, 4).map(board => (
                <div 
                  key={board.id} 
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="group p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-indigo-100/50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Layout className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm truncate">{board.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                    <span>{format(new Date(board.createdAt), 'MMM d, yyyy')}</span>
                    {board.created_by !== user?.id && user?.role !== 'Admin' && (
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Read Only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm">No whiteboards available. All shared sketches will appear here.</p>
            </div>
          )}
        </div>
      </div>

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
