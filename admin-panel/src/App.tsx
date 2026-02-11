import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
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
    <ErrorBoundary>
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
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                    <UsersPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BranchesPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/news"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                    <NewsPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/trainings"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TrainingsPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/activities"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                    <ActivitiesPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/trainings/:trainingId"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TrainingDetailPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/trainings/:trainingId/lessons/:lessonId"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LessonDetailPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/contact-messages"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                    <ContactMessagesPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/faq"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FAQPage />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                    <NotificationHistoryPage />
                  </ProtectedRoute>
                </ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;

