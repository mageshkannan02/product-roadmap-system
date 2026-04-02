/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './lib/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RoadmapManagement } from './pages/RoadmapManagement';
import { FeatureManagement } from './pages/FeatureManagement';
import { TaskTracking } from './pages/TaskTracking';
import { Boards } from './pages/Boards';
import { BoardEditor } from './pages/BoardEditor';
import { ProjectOverview } from './pages/ProjectOverview';
import AdminRequests from './pages/AdminRequests';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './lib/auth';

// Guard: blocks Team Members from accessing management pages
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/tasks" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="overview" element={<ProjectOverview />} />
            <Route path="roadmaps" element={
              <RequireRole roles={['Admin', 'Product Manager', 'Team Member']}><RoadmapManagement /></RequireRole>
            } />
            <Route path="features" element={
              <RequireRole roles={['Admin', 'Product Manager']}><FeatureManagement /></RequireRole>
            } />
            <Route path="tasks" element={<TaskTracking />} />
            <Route path="boards" element={
              <RequireRole roles={['Admin', 'Product Manager', 'Team Member']}><Boards /></RequireRole>
            } />
            <Route path="boards/:id" element={
              <RequireRole roles={['Admin', 'Product Manager', 'Team Member']}><BoardEditor /></RequireRole>
            } />
            <Route path="approvals" element={
              <RequireRole roles={['Admin', 'Product Manager']}><AdminRequests /></RequireRole>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
