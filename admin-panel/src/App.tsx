import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
// Dashboard removed — Users page will be the landing page
import UsersPage from './pages/users/UsersPage';
import BranchesPage from './pages/branches/BranchesPage';
import NewsPage from './pages/news/NewsPage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import TrainingsPage from './pages/trainings/TrainingsPage';
import TrainingDetailPage from './pages/trainings/TrainingDetailPage';
import LessonDetailPage from './pages/trainings/LessonDetailPage';
import ContactMessagesPage from './pages/contact-messages/ContactMessagesPage';
import FAQPage from './pages/faq/FAQPage';
import NotificationHistoryPage from './pages/notifications/NotificationHistoryPage';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          {/* Dashboard removed — redirect legacy routes to Users list */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin/users" replace />} />
          <Route path="/branch/dashboard" element={<Navigate to="/admin/users" replace />} />
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
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
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
            path="/admin/activities"
            element={
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                <ActivitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainings/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TrainingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainings/:trainingId/lessons/:lessonId"
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
          
          {/* Legacy branch routes - redirect to Users list */}
          <Route path="/branch/dashboard" element={<Navigate to="/admin/users" replace />} />
          <Route path="/branch/news" element={<Navigate to="/admin/news" replace />} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

