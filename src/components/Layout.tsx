import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { LayoutDashboard, Map, ListTodo, LogOut, CheckSquare, Presentation, PieChart, Shield, ClipboardCheck, MessageSquare, X } from 'lucide-react';
import { cn, formatUserName } from '../lib/utils';
import { NotificationBell } from './NotificationBell';
import { RoleRequestModal } from './RoleRequestModal';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
import toast from 'react-hot-toast';
import React, { useState } from 'react';

export function Layout() {
  const { user, logout, switchRole, myPendingRequest, dismissRequest } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState<any>('Admin');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isTeamMember = user.role === 'Team Member';

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Project Overview', href: '/overview', icon: PieChart },
    ...(!isTeamMember ? [
      { name: 'Roadmaps', href: '/roadmaps', icon: Map },
      { name: 'Features', href: '/features', icon: ListTodo },
    ] : [
      { name: 'My Projects', href: '/roadmaps', icon: Map },
    ]),
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Whiteboards', href: '/boards', icon: Presentation },
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Roadmap System</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className={cn('mr-3 h-5 w-5', isActive ? 'text-indigo-700' : 'text-gray-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-20">
          <p className="text-sm font-medium text-gray-500">
            {navItems.find(n => location.pathname === n.href || (n.href !== '/' && location.pathname.startsWith(n.href)))?.name || 'Dashboard'}
          </p>
          <div className="flex items-center space-x-4 pr-2">
            {/* Role Switcher */}
            <div className="flex items-center gap-3">
              {myPendingRequest && myPendingRequest.status === 'Pending' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-lg animate-pulse shadow-sm" title={`Pending Request: ${myPendingRequest.requested_role}`}>
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">Pending Approval</span>
                </div>
              )}
              
              {myPendingRequest && myPendingRequest.status === 'Rejected' && (
                <div className="flex items-center gap-2 group/reject relative">
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50/90 border border-rose-200/50 rounded-full cursor-help shadow-sm hover:bg-rose-100/90 transition-all pr-1" 
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-tight">Request Rejected</span>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismissRequest();
                      }}
                      className="p-0.5 hover:bg-rose-200/50 rounded-full transition-colors ml-1 group/dismiss"
                      title="Dismiss Feedback"
                    >
                      <X className="w-2.5 h-2.5 text-rose-400 group-hover/dismiss:text-rose-600" />
                    </button>
                    
                    {/* Premium Tooltip for Rejection Reason */}
                    <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white/95 backdrop-blur-md border border-rose-100 rounded-2xl shadow-2xl shadow-rose-200/50 opacity-0 invisible group-hover/reject:opacity-100 group-hover/reject:visible transition-all duration-300 z-50 transform origin-top-right group-hover/reject:translate-y-0 translate-y-1">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-100">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                        <div>
                          <span className="block text-[11px] font-black text-slate-900 uppercase tracking-widest">Rejection Reason</span>
                          <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-tighter">System Message</span>
                        </div>
                      </div>
                      <div className="relative">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 italic">
                          "{myPendingRequest.rejection_reason || 'The admin did not provide a specific reason.'}"
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Click notification to resolve</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <CustomDropdown
                value={user.role}
                onChange={async (newRole) => {
                  const roles = ['Team Member', 'Product Manager', 'Admin'];
                  const currentIndex = roles.indexOf(user.role);
                  const targetIndex = roles.indexOf(newRole);

                  // Admins (or those whose originalRole was Admin) can switch freely.
                  // Others can only switch DOWN without request.
                  if (user.originalRole === 'Admin' || targetIndex <= currentIndex) {
                    try {
                      await switchRole(newRole as any);
                      toast.success(`Switched to ${newRole} role!`);
                      navigate('/');
                    } catch {
                      toast.error('Failed to switch role');
                    }
                  } else {
                    setRequestedRole(newRole as any);
                    setIsRoleModalOpen(true);
                  }
                }}
                disabled={myPendingRequest && myPendingRequest.status === 'Pending'}
                prefixIcon={<Shield className="w-3.5 h-3.5 text-indigo-500" />}
                options={[
                  { value: 'Admin', label: 'Admin', colorClass: 'text-indigo-600' },
                  { value: 'Product Manager', label: 'Product Manager', colorClass: 'text-blue-600' },
                  { value: 'Team Member', label: 'Team Member', colorClass: 'text-slate-600' },
                ]}
                className="bg-gray-50 border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all h-9 px-3 py-1.5 min-w-[180px] border tracking-wider text-[11px] font-bold uppercase overflow-hidden"
                wrapperClassName="w-auto"
              />
            </div>

            {/* Approvals Link */}
            {(user.role === 'Admin' || user.role === 'Product Manager') && (
              <Link
                to="/approvals"
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative"
                title="Review Role Requests"
              >
                <ClipboardCheck className="w-5 h-5" />
              </Link>
            )}

            <NotificationBell />
            <div className="flex items-center pl-4 border-l border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-none">{formatUserName(user, user.id)}</p>
                  <p className="text-xs text-gray-500 mt-1">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pl-4 pr-6 py-6 bg-slate-50/10">
          <Outlet />
        </main>
      </div>

      <RoleRequestModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        requestedRole={requestedRole}
      />
    </div>
  );
}
