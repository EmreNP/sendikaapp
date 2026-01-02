import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import BranchDashboard from './pages/dashboard/BranchDashboard';
import UsersPage from './pages/users/UsersPage';
import BranchesPage from './pages/branches/BranchesPage';
import NewsPage from './pages/news/NewsPage';
import TrainingsPage from './pages/trainings/TrainingsPage';
import TrainingDetailPage from './pages/trainings/TrainingDetailPage';
import LessonDetailPage from './pages/trainings/LessonDetailPage';
import ContactMessagesPage from './pages/contact-messages/ContactMessagesPage';
import FAQPage from './pages/faq/FAQPage';
import NotificationHistoryPage from './pages/notifications/NotificationHistoryPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/branches"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BranchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <NewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TrainingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainings/detail"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TrainingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lessons/detail"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LessonDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contact-messages"
            element={
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                <ContactMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faq"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FAQPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                <NotificationHistoryPage />
              </ProtectedRoute>
            }
          />
          
          {/* Branch Manager Routes */}
          <Route
            path="/branch/dashboard"
            element={
              <ProtectedRoute allowedRoles={['branch_manager']}>
                <BranchDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

