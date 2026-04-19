import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './features/DashboardPage';
import DocumentPage from './features/documents/pages/DocumentPage';
import RoleManagementPage from './features/admin/pages/RoleManagementPage';
import UserManagementPage from './features/admin/pages/UserManagementPage';
import DepartmentTreePage from './features/departments/DepartmentTreePage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DocumentRepositoryPage from './features/documents/pages/DocumentRepositoryPage';
import AIConfigurationPage from './features/ai_config/AIConfigurationPage';
import HistoryPage from './features/history/HistoryPage';
import TranslationPage from './features/translation/TranslationPage';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentPage />} />
            <Route path="/translation" element={<TranslationPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/departments" element={<DepartmentTreePage />} />
            <Route path="/document-repository" element={<DocumentRepositoryPage />} />
            <Route path="/admin/ai-config" element={<AIConfigurationPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>
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