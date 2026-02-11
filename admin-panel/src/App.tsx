import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginPage from './pages/LoginPage';

// Lazy load pages for code splitting
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const BranchesPage = lazy(() => import('./pages/branches/BranchesPage'));
const NewsPage = lazy(() => import('./pages/news/NewsPage'));
const ActivitiesPage = lazy(() => import('./pages/activities/ActivitiesPage'));
const TrainingsPage = lazy(() => import('./pages/trainings/TrainingsPage'));
const TrainingDetailPage = lazy(() => import('./pages/trainings/TrainingDetailPage'));
const LessonDetailPage = lazy(() => import('./pages/trainings/LessonDetailPage'));
const ContactMessagesPage = lazy(() => import('./pages/contact-messages/ContactMessagesPage'));
const FAQPage = lazy(() => import('./pages/faq/FAQPage'));
const NotificationHistoryPage = lazy(() => import('./pages/notifications/NotificationHistoryPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Yükleniyor...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

