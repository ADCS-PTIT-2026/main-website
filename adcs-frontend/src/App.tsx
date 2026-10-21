import CrawlerSourcesPage from './features/integration/CrawlerSourcesPage';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import SSOCallbackPage from './features/auth/pages/SSOCallbackPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './features/DashboardPage';
import DocumentPage from './features/documents/pages/DocumentPage';
import MyDocumentsPage from './features/documents/pages/MyDocumentsPage';
import RoleManagementPage from './features/admin/pages/RoleManagementPage';
import UserManagementPage from './features/admin/pages/UserManagementPage';
import DepartmentTreePage from './features/departments/DepartmentTreePage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DocumentRepositoryPage from './features/documents/pages/DocumentRepositoryPage';
import AIConfigurationPage from './features/ai_config/AIConfigurationPage';
import HistoryPage from './features/history/HistoryPage';
import TranslationPage from './features/translation/TranslationPage';
import ProfilePage from './features/profile/ProfilePage';

import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './ProtectedRoute';
import { usePermission } from './hooks/usePermission';

const AdminRouteGuard = () => {
  const { isAdmin } = usePermission();

  if (isAdmin) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<SSOCallbackPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentPage />} />
            <Route path="/documents/my" element={<MyDocumentsPage />} />
            <Route path="/translation" element={<TranslationPage />} />
            <Route path="/departments" element={<DepartmentTreePage />} />
            <Route path="/document-repository" element={<DocumentRepositoryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            <Route element={<AdminRouteGuard />}>
              <Route path="/admin/roles" element={<RoleManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/crawler-sources" element={<CrawlerSourcesPage />} />
              <Route path="/admin/ai-config" element={<AIConfigurationPage />} />
            </Route>

          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;