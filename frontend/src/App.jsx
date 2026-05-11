import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import AddMemberPage from './pages/AddMemberPage';
import TrainersPage from './pages/TrainersPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import BillingPage from './pages/BillingPage';
import BranchesPage from './pages/BranchesPage';
import SettingsPage from './pages/SettingsPage';
import RenewalPage from './pages/RenewalPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function ProtectedRoute({ children }) {
  const token = useStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { fetchMe, token } = useStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/add" element={<AddMemberPage />} />
            <Route path="members/:id" element={<MemberDetailPage />} />
            <Route path="members/:id/renew" element={<RenewalPage />} />
            <Route path="trainers" element={<TrainersPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
